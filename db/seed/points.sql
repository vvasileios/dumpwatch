DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM zones) THEN
		RAISE EXCEPTION 'Collection points need zones. Seed zones first.';
	END IF;
	IF EXISTS (SELECT 1 FROM collection_points WHERE is_sample) THEN
		RAISE EXCEPTION 'Sample collection points are already loaded.';
	END IF;
END $$;

SELECT setseed(0.42);

INSERT INTO collection_points (type, location, fill_level, is_sample)
SELECT (ARRAY['mixed','recycling','glass','organic'])[1 + floor(random()*4)::int],
	p.geom::geography,
	floor(random()*101)::int,
	true
FROM ST_Dump(ST_GeneratePoints((SELECT ST_Union(boundary::geometry) FROM zones), 50000, 42)) AS p;

ANALYZE collection_points;
