SET jit = off;
SET plan_cache_mode = force_custom_plan;

BEGIN;

INSERT INTO dump_reports (location, description, status, reported_by, reported_at, cleared_at)
SELECT
	ST_SetSRID(ST_MakePoint(22.90 + random() * 0.10, 40.58 + random() * 0.08), 4326)::geography,
	'Benchmark report ' || g,
	s.status,
	'bench-user-' || (g % 1000),
	t.at,
	CASE WHEN s.status = 'cleared' THEN t.at + interval '1 day' END
FROM generate_series(1, 100000) AS g
CROSS JOIN LATERAL (SELECT now() - random() * interval '365 days' AS at) AS t
CROSS JOIN LATERAL (SELECT (ARRAY['open', 'assigned', 'cleared'])[1 + g % 3] AS status) AS s;

ANALYZE dump_reports;

PREPARE list(text, text, bigint, int) AS
SELECT id, status, description, reported_at, cleared_at,
	ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
FROM dump_reports
WHERE ($1::text IS NULL OR reported_by = $1)
	AND ($2::text IS NULL OR status = $2)
	AND ($3::bigint IS NULL OR (reported_at, id) <
		(SELECT reported_at, id FROM dump_reports
			WHERE id = $3 AND ($1::text IS NULL OR reported_by = $1)))
ORDER BY reported_at DESC, id DESC
LIMIT $4;

PREPARE list_offset(text, text, int) AS
SELECT id, status, description, reported_at, cleared_at,
	ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
FROM dump_reports
WHERE ($1::text IS NULL OR reported_by = $1)
	AND ($2::text IS NULL OR status = $2)
ORDER BY reported_at DESC, id DESC
LIMIT 26 OFFSET $3;

SELECT id AS deep_cursor FROM dump_reports ORDER BY reported_at DESC, id DESC OFFSET 4999 LIMIT 1 \gset
SELECT id AS deep_open_cursor FROM dump_reports WHERE status = 'open' ORDER BY reported_at DESC, id DESC OFFSET 4999 LIMIT 1 \gset

\o /dev/null
EXECUTE list(NULL, NULL, NULL, 26);
EXECUTE list(NULL, NULL, :deep_cursor, 26);
EXECUTE list_offset(NULL, NULL, 5000);
\o

\echo '== 1. staff, first page'
EXPLAIN (ANALYZE, BUFFERS) EXECUTE list(NULL, NULL, NULL, 26);

\echo '== 2. staff, page 201 by keyset cursor'
EXPLAIN (ANALYZE, BUFFERS) EXECUTE list(NULL, NULL, :deep_cursor, 26);

\echo '== 3. staff, page 201 by OFFSET 5000'
EXPLAIN (ANALYZE, BUFFERS) EXECUTE list_offset(NULL, NULL, 5000);

\echo '== 4. staff, status open, page 201 by keyset cursor'
EXPLAIN (ANALYZE, BUFFERS) EXECUTE list(NULL, 'open', :deep_open_cursor, 26);

\echo '== 5. citizen, first page'
EXPLAIN (ANALYZE, BUFFERS) EXECUTE list('bench-user-7', NULL, NULL, 26);

\echo '== 6. citizen, first page, generic plan (named prepared statement reused)'
SET plan_cache_mode = force_generic_plan;
EXPLAIN (ANALYZE, BUFFERS) EXECUTE list('bench-user-7', NULL, NULL, 26);
SET plan_cache_mode = force_custom_plan;

\echo '== 7. staff, first page, without the list indexes'
DROP INDEX dump_reports_reported_at_id_idx, dump_reports_status_reported_at_id_idx, dump_reports_reported_by_reported_at_id_idx;
EXPLAIN (ANALYZE, BUFFERS) EXECUTE list(NULL, NULL, NULL, 26);

ROLLBACK;
