-- migrate:up
ALTER TABLE dump_reports
	ADD CONSTRAINT dump_reports_reported_by_fkey
	FOREIGN KEY (reported_by) REFERENCES "user"(id) ON DELETE SET NULL;

-- migrate:down
ALTER TABLE dump_reports DROP CONSTRAINT dump_reports_reported_by_fkey;
