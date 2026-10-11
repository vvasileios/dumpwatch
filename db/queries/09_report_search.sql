SET jit = off;
SET plan_cache_mode = force_custom_plan;

BEGIN;

INSERT INTO dump_reports (location, description, status, reported_by, reported_at, cleared_at)
SELECT
	ST_SetSRID(ST_MakePoint(22.90 + random() * 0.10, 40.58 + random() * 0.08), 4326)::geography,
	CASE WHEN g % 1000 = 0 THEN 'Asbestos sheets' ELSE
		(ARRAY['Old fridge', 'Mattress', 'Rubble bags', 'Broken chairs', 'Tyres', 'Sofa', 'Washing machine', 'Garden waste'])[1 + g % 8]
	END || ' near the ' || (ARRAY['kiosk', 'bus stop', 'school', 'park', 'beach'])[1 + g % 5],
	s.status,
	'bench-user-' || (g % 1000),
	t.at,
	CASE WHEN s.status = 'cleared' THEN t.at + interval '1 day' END
FROM generate_series(1, 100000) AS g
CROSS JOIN LATERAL (SELECT now() - random() * interval '365 days' AS at) AS t
CROSS JOIN LATERAL (SELECT (ARRAY['open', 'assigned', 'cleared'])[1 + g % 3] AS status) AS s;

ANALYZE dump_reports;

PREPARE list_count(text, text, text, bigint) AS
SELECT count(*)::int AS total FROM dump_reports
WHERE ($1::text IS NULL OR reported_by = $1)
	AND ($2::text IS NULL OR status = $2)
	AND ($3::text IS NULL
		OR description ILIKE '%' || $3 || '%'
		OR id = $4::bigint);

PREPARE list_rows(text, text, text, bigint, int, int) AS
SELECT id, status, description, reported_at, cleared_at,
	ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
FROM dump_reports
WHERE ($1::text IS NULL OR reported_by = $1)
	AND ($2::text IS NULL OR status = $2)
	AND ($3::text IS NULL
		OR description ILIKE '%' || $3 || '%'
		OR id = $4::bigint)
ORDER BY reported_at DESC, id DESC
LIMIT $5 OFFSET $6;

\o /dev/null
EXECUTE list_count(NULL, NULL, NULL, NULL);
EXECUTE list_count(NULL, NULL, 'asbestos', NULL);
\o

\echo '== 1. staff, total count, no filter'
EXPLAIN (ANALYZE, BUFFERS) EXECUTE list_count(NULL, NULL, NULL, NULL);

\echo '== 2. staff, page 1 rows'
EXPLAIN (ANALYZE, BUFFERS) EXECUTE list_rows(NULL, NULL, NULL, NULL, 25, 0);

\echo '== 3. staff, page 201 rows (OFFSET 5000)'
EXPLAIN (ANALYZE, BUFFERS) EXECUTE list_rows(NULL, NULL, NULL, NULL, 25, 5000);

\echo '== 4. staff, count, rare search "asbestos" (100 rows)'
EXPLAIN (ANALYZE, BUFFERS) EXECUTE list_count(NULL, NULL, 'asbestos', NULL);

\echo '== 5. staff, page 1 rows, rare search "asbestos"'
EXPLAIN (ANALYZE, BUFFERS) EXECUTE list_rows(NULL, NULL, 'asbestos', NULL, 25, 0);

\echo '== 6. staff, count, common search "fridge" (12,500 rows)'
EXPLAIN (ANALYZE, BUFFERS) EXECUTE list_count(NULL, NULL, 'fridge', NULL);

\echo '== 7. staff, count, search "4242" (number: description or id)'
EXPLAIN (ANALYZE, BUFFERS) EXECUTE list_count(NULL, NULL, '4242', 4242);

\echo '== 8. citizen, count, search "fridge"'
EXPLAIN (ANALYZE, BUFFERS) EXECUTE list_count('bench-user-7', NULL, 'fridge', NULL);

\echo '== 9. staff, count, rare search, without the trigram index'
DROP INDEX dump_reports_description_trgm_idx;
EXPLAIN (ANALYZE, BUFFERS) EXECUTE list_count(NULL, NULL, 'asbestos', NULL);

ROLLBACK;
