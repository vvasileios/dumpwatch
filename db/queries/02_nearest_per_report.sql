SELECT r.id AS report_id, cp.id AS nearest_point_id,
	round(ST_Distance(r.location, cp.location)) AS meters
FROM dump_reports r
CROSS JOIN LATERAL (
	SELECT id, location FROM collection_points
	ORDER BY location <-> r.location
	LIMIT 1
) cp
WHERE r.status = 'open';