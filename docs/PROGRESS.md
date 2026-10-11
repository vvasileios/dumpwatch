# Progress

Where the build is and what comes next. Update **Status** and **Next** at the end of every working session.

## Status (2026-10-11)

Done and committed:

- **Infra:** Docker/Make, PostGIS, Tailwind v4, Lucide icons (`@nuxt/icon`, local bundle), Better Auth (admin/organization/2FA plugins, RBAC roles), login page, PostHog-style menubar + Cmd/Ctrl+K palette, `AppLoader`.
- **DB slices 1–5:** schema, seed, 4 core queries, EXPLAIN experiments in README.
- **Slice 6:** nearby collection points (API + map + panel + "Near me").
- **Slice 7a:** reports API (GET bbox, POST, PATCH status, all tested).
- **Slice 7b:** report form (`/reports/new`) with all review fixes (draft restore on 401, location race, shared limits).
- **Slice 7c:** reports layer on the main map (toggle, debounced/aborted bbox fetch, status colours + legend, popup with date, zoom-in guard). Browser-tested.
- **Slice 7d:** `/reports` list with keyset paging, own vs all, staff status select, EXPLAIN in README.

## Next

1. **Slice 8:** zone dashboard on `/zones` (SSR `useFetch`).
   - `GET /api/stats/zones` from `db/queries/03_zone_dashboard.sql`; return the average time to clear as epoch seconds or use `justify_interval` (a raw `interval` is awkward to serialise).
   - `GET /api/stats/weekly` from `db/queries/04_weekly_trend.sql`; fill empty weeks with `generate_series`.
2. **Slice 9:** nearest collection point per report (`db/queries/02_nearest_per_report.sql`, KNN `<->`).
3. **Before real data:**
   - Migrations (dbmate); this also enables the `reported_by` foreign key.
   - A few API tests.
   - Production Dockerfile (`nuxt build`), Caddy for HTTPS.
   - Least-privilege DB role.
   - Mailpit for auth emails.
   - Decide on public sign-up (`disableSignUp`).

## Known debt and open decisions

- `dump_reports.reported_by` has no FK to Better Auth's `"user"` table (see [architecture](architecture.md#data-model)). Fixed by migrations.
- No test suite, linter, formatter config, or CI yet. `make typecheck` is the only automated check.
- Schema changes go through `db/init` and need `make reset`, which wipes the database.
- Seed dates shift with `now()` on every reset; ids and locations stay the same.
