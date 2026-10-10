SELECT	setseed(0.42);

INSERT INTO zones (name, boundary) VALUES
	('West',    ST_MakeEnvelope(22.90, 40.60, 22.93, 40.66, 4326)::geography),
	('Center',  ST_MakeEnvelope(22.93, 40.60, 22.96, 40.66, 4326)::geography),
	('East',    ST_MakeEnvelope(22.96, 40.60, 22.99, 40.66, 4326)::geography);

INSERT INTO collection_points (type, location, fill_level)
SELECT (ARRAY['mixed','recycling','glass','organic'])[1 + floor(random()*4)::int],
	ST_SetSRID(ST_MakePoint(22.90 + random()*0.09, 40.60 + random()*0.06), 4326)::geography,
	floor(random()*101)::int
FROM generate_series(1, 50000);

INSERT INTO dump_reports (location, description, status, reported_at, cleared_at)
SELECT loc, 'Seeded report', st, ts,
       CASE WHEN st = 'cleared' THEN LEAST(now(), ts + random() * interval '5 days') END
FROM (
	SELECT ST_SetSRID(ST_MakePoint(22.90 + random()*0.09, 40.60 + random()*0.06), 4326)::geography AS loc,
			(ARRAY['open','assigned','cleared'])[1 + floor(random()*3)::int] AS st,
			now() - random() * interval '60 days' AS ts
	FROM generate_series(1, 500)
) s;

ANALYZE;