SELECT z.id, z.name,
	count(r.id) FILTER (WHERE r.status = 'open')::int     AS open,
	count(r.id) FILTER (WHERE r.status = 'assigned')::int AS assigned,
	count(r.id) FILTER (WHERE r.status = 'cleared')::int  AS cleared,
	round(extract(epoch FROM avg(r.cleared_at - r.reported_at)) / 3600, 1)::float8 AS avg_hours_to_clear
FROM zones z
LEFT JOIN dump_reports r ON ST_Covers(z.boundary, r.location)
GROUP BY z.id, z.name
UNION ALL
SELECT NULL, NULL,
	count(r.id) FILTER (WHERE r.status = 'open')::int,
	count(r.id) FILTER (WHERE r.status = 'assigned')::int,
	count(r.id) FILTER (WHERE r.status = 'cleared')::int,
	round(extract(epoch FROM avg(r.cleared_at - r.reported_at)) / 3600, 1)::float8
FROM dump_reports r
ORDER BY open DESC, name;
