PREPARE weekly_all(int, text) AS
WITH counts AS (
	SELECT date_trunc('week', reported_at, $2) AS week, count(*)::int AS reports
	FROM dump_reports
	WHERE reported_at >= date_trunc('week', now() - ($1 - 1) * interval '1 week', $2)
	GROUP BY 1
)
SELECT w.week, coalesce(c.reports, 0) AS reports
FROM generate_series(
	date_trunc('week', now() - ($1 - 1) * interval '1 week', $2),
	date_trunc('week', now(), $2),
	interval '1 week',
	$2
) AS w(week)
LEFT JOIN counts c USING (week)
ORDER BY w.week;

PREPARE weekly_zone(int, text, bigint) AS
WITH counts AS (
	SELECT date_trunc('week', r.reported_at, $2) AS week, count(*)::int AS reports
	FROM zones z
	JOIN dump_reports r ON ST_Covers(z.boundary, r.location)
	WHERE z.id = $3
		AND r.reported_at >= date_trunc('week', now() - ($1 - 1) * interval '1 week', $2)
	GROUP BY 1
)
SELECT w.week, coalesce(c.reports, 0) AS reports
FROM generate_series(
	date_trunc('week', now() - ($1 - 1) * interval '1 week', $2),
	date_trunc('week', now(), $2),
	interval '1 week',
	$2
) AS w(week)
LEFT JOIN counts c USING (week)
WHERE EXISTS (SELECT 1 FROM zones WHERE id = $3)
ORDER BY w.week;

EXECUTE weekly_all(12, 'Europe/Athens');
EXECUTE weekly_zone(12, 'Europe/Athens', 2);
EXECUTE weekly_zone(12, 'Europe/Athens', 999);
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) EXECUTE weekly_zone(12, 'Europe/Athens', 2);
