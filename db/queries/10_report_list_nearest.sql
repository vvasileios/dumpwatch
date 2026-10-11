SET jit = off;

BEGIN;

INSERT INTO dump_reports (location, description, reported_at)
SELECT
	ST_SetSRID(ST_MakePoint(22.90 + random() * 0.10, 40.58 + random() * 0.08), 4326)::geography,
	'Benchmark report ' || g,
	now() - random() * interval '365 days'
FROM generate_series(1, 100000) AS g;

ANALYZE dump_reports;

\echo '== 1. nearest point AFTER paging: KNN runs for the 25 rows of the page'
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT p.id, n.nearest
FROM (
	SELECT id, reported_at, location FROM dump_reports
	ORDER BY reported_at DESC, id DESC
	LIMIT 25 OFFSET 0
) p
LEFT JOIN LATERAL (
	SELECT json_build_object('id', cp.id::text, 'type', cp.type, 'fill_level', cp.fill_level,
		'meters', round(ST_Distance(cp.location, p.location))::int) AS nearest
	FROM collection_points cp
	ORDER BY cp.location <-> p.location
	LIMIT 1
) n ON true
ORDER BY p.reported_at DESC, p.id DESC;

\echo '== 2. nearest point BEFORE paging, sorted by distance: KNN for every report'
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT r.id, n.meters
FROM dump_reports r
LEFT JOIN LATERAL (
	SELECT round(ST_Distance(cp.location, r.location))::int AS meters
	FROM collection_points cp
	ORDER BY cp.location <-> r.location
	LIMIT 1
) n ON true
ORDER BY n.meters DESC
LIMIT 25;

\echo '== 3. KNN without the GiST index'
DROP INDEX collection_points_location_gix;
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT p.id, n.nearest
FROM (
	SELECT id, reported_at, location FROM dump_reports
	ORDER BY reported_at DESC, id DESC
	LIMIT 25
) p
LEFT JOIN LATERAL (
	SELECT cp.id AS nearest
	FROM collection_points cp
	ORDER BY cp.location <-> p.location
	LIMIT 1
) n ON true;

ROLLBACK;
