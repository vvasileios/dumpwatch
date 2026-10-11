DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM zones) THEN
		RAISE EXCEPTION 'Reports need zones. Seed zones first.';
	END IF;
	IF EXISTS (SELECT 1 FROM dump_reports WHERE is_sample) THEN
		RAISE EXCEPTION 'Sample reports are already loaded.';
	END IF;
END $$;

SELECT setseed(0.7);

INSERT INTO dump_reports (location, description, status, reported_at, cleared_at, is_sample)
SELECT loc, 'Seeded report', st, ts,
	CASE WHEN st = 'cleared' THEN LEAST(now(), ts + random() * interval '5 days') END,
	true
FROM (
	SELECT p.geom::geography AS loc,
		(ARRAY['open','assigned','cleared'])[1 + floor(random()*3)::int] AS st,
		now() - random() * interval '60 days' AS ts
	FROM ST_Dump(ST_GeneratePoints((SELECT ST_Union(boundary::geometry) FROM zones), 500, 7)) AS p
) s;

ANALYZE dump_reports;
