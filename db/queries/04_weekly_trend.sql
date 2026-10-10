SELECT date_trunc('week', reported_at) AS week, count(*) AS reports
FROM dump_reports
WHERE reported_at >= now() - interval '60 days'
GROUP BY week
ORDER BY week;