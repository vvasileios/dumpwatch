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
- **Shared UI kit:** `app/components/shared/` (Button, IconButton, Field, Input, Textarea, Select, Checkbox) replaces the copied class strings in login, report form, reports list, nearby panel, menubar, and layout. Status change in the list is now optimistic with revert. Browser-tested.
- **Reports pages split:** `components/reports/` (ReportsTable, ReportsForm) and `useReportForm` composable; pages only wire state to components. Browser-tested.
- **Reports list UX:** page numbers (OFFSET + count) with rows-per-page, search (description or #id, `pg_trgm` index), status filter, sortable Status/Reported/Cleared columns, all in the URL. Replaced keyset Load more. EXPLAIN in `db/queries/09_report_search.sql`. API and browser tested.
- **Slice 8:** zone dashboard on `/zones`: `GET /api/stats/zones` (GROUPING SETS city row, avg hours to clear) and `GET /api/stats/weekly?zone=` (12 weeks, `generate_series` in Europe/Athens, empty weeks filled), `useZoneDashboard`, `ZonesCard`, `ZonesTrend` (plain HTML bar chart). API and browser tested, light/dark/phone.
- **Slice 8 review fixes:** weekly trend bucketed with `date_trunc(..., tz)` (DST weeks lost/double-counted an hour), zone trend in one query with one GiST scan, city row counts border reports once, Retry buttons for stats/trend errors, `?zone=02` normalised, and `parseInput` gives every handler the `fieldErrors` 400 shape.
- **Slice 9:** nearest collection point per report in the `/reports` table (type, distance, fill level): `LEFT JOIN LATERAL ... ORDER BY location <-> ... LIMIT 1` after paging; status updates merge the PATCH response so the column survives. EXPLAIN in `db/queries/10_report_list_nearest.sql` (4.5 ms after paging vs 2.9 s per-report vs 271 ms without GiST). API and browser tested.

## Next

1. **Slice 10 (proposal):** `/collection-points` staff page: hotspots = collection points with open dumps nearby (`ST_DWithin`), full bins first; nearest point in map report popups.
2. **Before real data:**
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
- Zones share edges: a report exactly on a border counts in both zone cards (`ST_Covers`), so zone cards can add up to more than the city card (which counts each report once).
- Only one table so far (`ReportsTable`); extract a `SharedTable` when a second one appears.
