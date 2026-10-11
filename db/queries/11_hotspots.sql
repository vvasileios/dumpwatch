SET jit = off;

\echo '== 1. hotspots, driven from the ~340 unresolved reports (GiST on collection_points per report)'
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT cp.id, cp.type, cp.fill_level,
	count(*)::int AS reports_nearby,
	floor(extract(epoch FROM now() - min(r.reported_at)) / 86400)::int AS oldest_days
FROM dump_reports r
JOIN collection_points cp ON ST_DWithin(cp.location, r.location, 50)
WHERE r.status IN ('open', 'assigned')
GROUP BY cp.id
ORDER BY reports_nearby DESC, cp.fill_level DESC NULLS LAST, cp.id
LIMIT 50;

\echo '== 2. same question asked from the 50k points (correlated count per point)'
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT cp.id, n.reports_nearby
FROM collection_points cp
CROSS JOIN LATERAL (
	SELECT count(*)::int AS reports_nearby
	FROM dump_reports r
	WHERE r.status IN ('open', 'assigned') AND ST_DWithin(cp.location, r.location, 50)
) n
WHERE n.reports_nearby > 0
ORDER BY n.reports_nearby DESC, cp.fill_level DESC NULLS LAST, cp.id
LIMIT 50;
