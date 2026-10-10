SET jit = off;

PREPARE nearest(float8, float8) AS
SELECT id, type, fill_level,
        ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng,
        ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS meters
FROM collection_points
ORDER BY location <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
LIMIT 20;

\o /dev/null
EXECUTE nearest(22.95, 40.64);
\o
EXPLAIN (ANALYZE, BUFFERS) EXECUTE nearest(22.95, 40.64);