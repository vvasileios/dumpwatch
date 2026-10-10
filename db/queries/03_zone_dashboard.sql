SELECT z.name,
	count(r.id) FILTER (WHERE r.status = 'open')    AS open,
	count(r.id) FILTER (WHERE r.status = 'cleared') AS cleared,
	avg(r.cleared_at - r.reported_at) FILTER (WHERE r.status = 'cleared') AS avg_time_to_clear
FROM zones z
LEFT JOIN dump_reports r ON ST_Covers(z.boundary, r.location)
GROUP BY z.id, z.name
ORDER BY open DESC;