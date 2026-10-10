SET jit = off;

PREPARE nearby(float8, float8, float8) AS
SELECT id, type, fill_level,
	ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng,
	ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS meters
FROM collection_points
WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
ORDER BY meters
LIMIT 20;

\o /dev/null
EXECUTE nearby(22.95, 40.64, 500);
\o
EXPLAIN (ANALYZE, BUFFERS) EXECUTE nearby(22.95, 40.64, 500);

BEGIN;
DROP INDEX collection_points_location_gix;
\o /dev/null
EXECUTE nearby(22.95, 40.64, 500);
\o
EXPLAIN (ANALYZE, BUFFERS) EXECUTE nearby(22.95, 40.64, 500);
ROLLBACK;