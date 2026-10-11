CREATE TABLE zones (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	name text NOT NULL,
	boundary geography(Polygon, 4326) NOT NULL
);

CREATE TABLE collection_points (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	type text NOT NULL CHECK (type IN ('mixed','recycling','glass','organic')),
	location geography(Point, 4326) NOT NULL,
	fill_level smallint CHECK (fill_level BETWEEN 0 AND 100),
	updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE dump_reports (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	location geography(Point, 4326) NOT NULL,
	description text,
	status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','assigned','cleared')),
	reported_by text,
	reported_at timestamptz NOT NULL DEFAULT now(),
	cleared_at timestamptz,
	CONSTRAINT dump_reports_cleared_at_matches_status
		CHECK ((status = 'cleared') = (cleared_at IS NOT NULL)),
	CONSTRAINT dump_reports_cleared_after_reported
		CHECK (cleared_at >= reported_at),
	CONSTRAINT dump_reports_description_length
		CHECK (description IS NULL OR char_length(description) BETWEEN 5 AND 1000)
);

CREATE INDEX collection_points_location_gix ON collection_points USING gist (location);
CREATE INDEX dump_reports_location_gix ON dump_reports USING gist (location);
CREATE INDEX dump_reports_reported_at_id_idx ON dump_reports (reported_at, id);
CREATE INDEX dump_reports_status_reported_at_id_idx ON dump_reports (status, reported_at, id);
CREATE INDEX dump_reports_reported_by_reported_at_id_idx ON dump_reports (reported_by, reported_at, id);
CREATE INDEX dump_reports_description_trgm_idx ON dump_reports USING gin (description gin_trgm_ops);
