-- migrate:up
ALTER TABLE zones ADD COLUMN is_sample boolean NOT NULL DEFAULT false;
ALTER TABLE collection_points ADD COLUMN is_sample boolean NOT NULL DEFAULT false;
ALTER TABLE dump_reports ADD COLUMN is_sample boolean NOT NULL DEFAULT false;

-- migrate:down
ALTER TABLE dump_reports DROP COLUMN is_sample;
ALTER TABLE collection_points DROP COLUMN is_sample;
ALTER TABLE zones DROP COLUMN is_sample;
