# Progress

Where the build is and what comes next. Update **Status** and **Next** at the end of every working session.

## Status (2026-10-11)

Done and committed:

- **Infra:** Docker/Make, PostGIS, Tailwind v4, Lucide icons (`@nuxt/icon`, local bundle), Better Auth (admin/organization/2FA plugins, RBAC roles), login page, PostHog-style menubar + Cmd/Ctrl+K palette, `AppLoader`.
- **DB slices 1–5:** schema, seed, 4 core queries, EXPLAIN experiments (now in `docs/performance.md`).
- **Slice 6:** nearby collection points (API + map + panel + "Near me").
- **Slice 7a:** reports API (GET bbox, POST, PATCH status, all tested).
- **Slice 7b:** report form (`/reports/new`) with all review fixes (draft restore on 401, location race, shared limits).
- **Slice 7c:** reports layer on the main map (toggle, debounced/aborted bbox fetch, status colours + legend, popup with date, zoom-in guard). Browser-tested.
- **Slice 7d:** `/reports` list with keyset paging, own vs all, staff status select, EXPLAIN in `docs/performance.md`.
- **Shared UI kit:** `app/components/shared/` (Button, IconButton, Field, Input, Textarea, Select, Checkbox) replaces the copied class strings in login, report form, reports list, nearby panel, menubar, and layout. Status change in the list is now optimistic with revert. Browser-tested.
- **Reports pages split:** `components/reports/` (ReportsTable, ReportsForm) and `useReportForm` composable; pages only wire state to components. Browser-tested.
- **Reports list UX:** page numbers (OFFSET + count) with rows-per-page, search (description or #id, `pg_trgm` index), status filter, sortable Status/Reported/Cleared columns, all in the URL. Replaced keyset Load more. EXPLAIN in `db/queries/09_report_search.sql`. API and browser tested.
- **Slice 8:** zone dashboard on `/zones`: `GET /api/stats/zones` (GROUPING SETS city row, avg hours to clear) and `GET /api/stats/weekly?zone=` (12 weeks, `generate_series` in Europe/Athens, empty weeks filled), `useZoneDashboard`, `ZonesCard`, `ZonesTrend` (plain HTML bar chart). API and browser tested, light/dark/phone.
- **Slice 8 review fixes:** weekly trend bucketed with `date_trunc(..., tz)` (DST weeks lost/double-counted an hour), zone trend in one query with one GiST scan, city row counts border reports once, Retry buttons for stats/trend errors, `?zone=02` normalised, and `parseInput` gives every handler the `fieldErrors` 400 shape.
- **Slice 9:** nearest collection point per report in the `/reports` table (type, distance, fill level): `LEFT JOIN LATERAL ... ORDER BY location <-> ... LIMIT 1` after paging; status updates merge the PATCH response so the column survives. EXPLAIN in `db/queries/10_report_list_nearest.sql` (4.5 ms after paging vs 2.9 s per-report vs 271 ms without GiST). API and browser tested.
- **Slice 10:** `/collection-points` hotspots (staff): `GET /api/points/hotspots?radius=` (ST_DWithin from unresolved reports, EXPLAIN in `db/queries/11_hotspots.sql`), `SharedTable` extracted (reports + hotspots), `PointsBadge`, map opens at `?lat&lng`, nearest point in map report popups (shared `NEAREST_POINT_JOIN`, ~20 ms for 500 reports). API and browser tested.
- **Migrations (dbmate 2.36):** `db/migrations/` owns the whole schema (extensions, Better Auth tables, app tables, new `reported_by` FK with ON DELETE SET NULL); one-shot `migrate` service before the app; `make migrate / migration / rollback / migrate-status / seed`; `db/init` removed, seed moved to `db/seed.sql` (guarded); Better Auth runtime auto-migration replaced by a startup drift check that prints the SQL. Existing DB baselined (no reset); fresh DB and full rollback verified on a scratch database.
- **Seed manager:** first run is empty (admin only). Admin-only wand in the top bar opens a modal to seed/remove zones, collection points, reports and demo users (citizen + moderator, password shown); `is_sample` column (migration); remove deletes only sample rows; dependencies enforced in SQL guards + an advisory lock; `demo: ["manage"]` permission; `runtimeConfig.public.demoTools` (on in dev, off in production unless `NUXT_PUBLIC_DEMO_TOOLS=true`). Baseline migrations renamed to 20261011… (they were dated in the future). API and browser tested.
- **API tests:** `make test` (32 tests, ~15 s): drops/migrates `dumpwatch_test`, builds the app (`nuxt build`, .nuxt on tmpfs so dev is untouched), runs it on :3001 with `NODE_ENV=production`, runs `tests/*.test.ts` with node:test, type-checked by `tests/tsconfig.json`. Covers auth on every endpoint, 400 fieldErrors, reports/list/map/nearby/hotspots/stats/seed manager, brute-force cross-checks in SQL, rate limiting. Verified it catches a broken search escape.
- **Presentation:** GitHub Actions CI (`make typecheck` + `make test`), README rewritten as a project tour with screenshots and design decisions, EXPLAIN results moved to `docs/performance.md`, multi-tenancy design doc.

## Next

1. **Multi-tenancy** (municipalities, contractors, org roles, row-level security): design in [design/multi-tenancy.md](design/multi-tenancy.md), rollout in 5 steps.
2. **Before real data:**
   - Production Dockerfile (`nuxt build`), Caddy for HTTPS.
   - Least-privilege DB role.
   - Mailpit for auth emails.
   - Decide on public sign-up (`disableSignUp`).

## Known debt and open decisions

- No linter, formatter config, or CI yet. `make typecheck` + `make test` are the automated checks; there are no browser (UI) tests.
- Production must set `NODE_ENV=production`: Better Auth only rate-limits (sign-in/up: 3 per 10 s) when it is. Behind Caddy, set `advanced.ipAddress.ipAddressHeaders` / `trustedProxies`, otherwise all clients share one rate-limit bucket.
- Seed dates shift with `now()` on every reset; ids and locations stay the same.
- Zones share edges: a report exactly on a border counts in both zone cards (`ST_Covers`), so zone cards can add up to more than the city card (which counts each report once).
