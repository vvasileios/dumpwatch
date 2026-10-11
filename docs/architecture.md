# Architecture

Detailed map of the codebase. The short rules live in [AGENTS.md](../AGENTS.md); progress lives in [PROGRESS.md](PROGRESS.md).

## Request flow

```
browser ── page (app/pages) ── composable (app/composables) ── $fetch / useFetch
                                                                     │
Nitro handler (server/api) ── requireSession / requirePermission ────┘
       │ Zod validation (query, params, body)
       │ db().query(SQL, [params])            raw SQL, no ORM
       ▼
PostgreSQL 18 + PostGIS 3.6
```

Pattern: state lives in a composable, components draw state and emit events, every rule is enforced on the server. Hiding UI by role is cosmetic.

## File map

```
app/
  pages/index.vue              map + nearby panel (slice 6) + reports layer (7c); ?lat&lng&radius&type (hotspot "Show" link) opens at zoom 18 with the point highlighted, a dashed circle for the hotspot radius, and reports on (no nearby search)
  pages/reports/new.vue        report form (7b): map + <ReportsForm>, state in useReportForm
  pages/reports/index.vue      report list (7d): own for citizens, all + status select for staff; search, status filter, sortable columns, page numbers; all state in the URL (?q&status&page&size&sort&dir); one-shot "Report sent" banner
  pages/zones.vue              zone dashboard (8), staff only: city + per-zone cards, 12-week trend; selected zone in ?zone=
  pages/collection-points.vue  hotspots (10), staff only: points with open/assigned dumps within ?radius= (25/50/100 m), "Show" links to the map
  pages/login.vue              layout: false
  layouts/default.vue          menubar + window frame (maximize = full-bleed)
  middleware/auth.global.ts    fetches session → useState("session"); redirects; checks meta.roles
  composables/useNearby.ts     nearby state + fetch (abort, request counter)
  composables/useReportList.ts list state from route.query (parsed with defaults, invalid values ignored) → useFetch (SSR, refetch on change); writes go back to the URL (push for pages, replace for search after 300 ms); any change but page resets to page 1; PATCH status (optimistic, reverts on error)
  composables/useHotspots.ts   useFetch (SSR) on ?radius=, radius is a writable computed that pushes the URL
  composables/useZoneDashboard.ts  two useFetch (SSR) in parallel: stats + weekly (query follows ?zone=, read with a regex); select() pushes the URL
  composables/useReportForm.ts report form state: draft save/restore on 401, geolocation race guard, error mapping, submit
  composables/useReports.ts    reports layer: watch [show, bbox] → 300 ms debounce → fetch (abort); span guard
  composables/useLeafletMap.ts shared Leaflet setup (tiles, view, zoom, unmount-safe, ResizeObserver)
  components/                  MapView.client.vue, LocationPicker.client.vue, NearbyPanel.vue,
                               ReportsLayerCard.vue (v-model:show), AppMenubar.vue,
                               AppCommandPalette.vue (Cmd/Ctrl+K), AppLoader.vue, AppEmptyState.vue
  components/reports/          ReportsTable.vue (rows, sortable headers, sticky thead, nearest collection point column, emits status/sort), ReportsPagination.vue (v-model:size, emits go), ReportsForm.vue (v-model:description, emits locate/submit);
                               file names start with the folder name so Nuxt dedupes the prefix (<ReportsTable>, not <ReportsReportsTable>)
  components/points/           PointsBadge.vue (type dot + type, optional distance, fill level red from 80%)
  components/zones/            ZonesCard.vue (toggle button, aria-pressed, status counts + avg time to clear), ZonesTrend.vue (HTML/CSS bar chart:
                               bars with sr-only text + hover/focus tooltip, current week faded "so far", labels via NuxtTime in CITY_TIMEZONE)
  components/shared/           UI kit, auto-imported as <SharedX>: Button (primary/secondary/ghost,
                               `to` renders NuxtLink, `loading`/`icon`), IconButton (required label),
                               Field (label), Input (trailing slot), Textarea, Select (typed options), Table (generic: columns, optional sort, #cell-<key> slots, sticky header, scroll reset),
                               Checkbox; all form controls use v-model (defineModel)
  utils/                       nav.ts (one nav list, role-filtered), auth-client.ts, point-types.ts,
                               report-status.ts (reportStatusColors), field.ts (fieldClass: shared
                               border/focus/invalid styles for inputs, textareas, selects), format.ts (formatHours)
  types/page-meta.d.ts         PageMeta.roles / title
server/
  api/auth/[...all].ts         Better Auth handler
  api/health.get.ts
  api/points/nearby.get.ts     query 1 + service-area guard
  api/points/hotspots.get.ts   report:moderate; ST_DWithin join driven from unresolved reports, GROUP BY cp.id, top 50
  api/reports.get.ts           bbox query (&& envelope), span-limited
  api/reports.post.ts          create, 422 outside service area
  api/reports/[id].patch.ts    status change, keeps cleared_at consistent
  api/reports/list.get.ts      OFFSET page numbers + count (page clamped to the last page); q = description ILIKE (%/_ escaped) or id; sort by whitelisted ORDER BY fragments; own vs all via report:moderate; page rows (subquery with LIMIT/OFFSET) then LEFT JOIN LATERAL KNN `<->` for the nearest collection point (25 lookups, not one per report); returns { reports: ReportListItem[] (DumpReport + nearest), total, page, canModerate }
  api/stats/zones.get.ts       report:moderate; query 3: per-zone rows UNION ALL a city row straight from dump_reports (border reports count once) → { city, zones }; counts ::int, avg time as hours ::float8
  api/stats/weekly.get.ts      report:moderate; ?zone (404 if missing, from the same query); query 4: reports bucketed once with date_trunc('week', ts, Europe/Athens) (DST-safe), LEFT JOINed onto generate_series weeks; zone variant scans the GiST index once
  utils/db.ts                  lazy pg Pool from runtimeConfig.databaseUrl
  utils/auth.ts                auth, requireSession, requirePermission, hasPermission
  utils/nearest.ts             NEAREST_POINT_JOIN: LEFT JOIN LATERAL KNN on outer alias p (list and map endpoints)
  utils/validate.ts            parseInput(schema, input): Zod safeParse → 400 with fieldErrors (every handler)
  utils/geo.ts                 isInServiceArea (ST_Covers on zones)
  plugins/auth-bootstrap.ts    on start: fails with the needed SQL if Better Auth's schema drifted (compileMigrations), then seeds the admin
shared/
  types/collection-point.ts, report.ts (DumpReport, ReportStatus, Bbox tuple)
  types/stats.ts               ZoneCounts, ZoneStats, ZoneDashboard, WeeklyCount
  utils/stats.ts               CITY_TIMEZONE, TREND_WEEKS
  utils/permissions.ts         ac + roles: user / moderator / admin
  utils/nearby.ts, reports.ts  limits shared by client and server
db/
  migrations/                  dbmate: 0000 extensions, 0100 Better Auth tables, 0200 app tables, 0300 reported_by FK
  schema.sql                   generated by dbmate after each migrate/rollback (read-only reference)
  seed.sql                     sample data, make seed
  queries/01-04                core queries
  queries/05-07                EXPLAIN experiments (index on/off inside a rolled-back txn)
  queries/08                   report list paging on 100k rows (rolled-back txn)
  queries/10                   nearest point per page row vs per report vs no GiST, on 100k reports (rolled-back txn)
  queries/11                   hotspots: driven from reports (17 ms) vs from 50k points (149 ms)
  queries/09                   report search + count + OFFSET on 100k rows, trigram index on/off (rolled-back txn)
  explain/                     saved plans
```

## Data model

- `zones(boundary geography(Polygon, 4326))`
- `collection_points(location geography(Point, 4326), type, fill_level 0–100)`
- `dump_reports(location geography(Point, 4326), description, status, reported_by text, reported_at, cleared_at)`
- Indexes: GiST on both `location` columns; list B-trees `(reported_at, id)`, `(status, reported_at, id)`, `(reported_by, reported_at, id)`; `pg_trgm` GIN on `description` for `ILIKE '%…%'` search.
- Constraints: `status IN (open, assigned, cleared)`; `(status = 'cleared') = (cleared_at IS NOT NULL)`; `cleared_at >= reported_at`; description 5–1000 chars.
- `reported_by text REFERENCES "user"(id) ON DELETE SET NULL`: deleting a user keeps their reports, without a reporter.
- Schema is owned by dbmate migrations (`db/migrations/`), Better Auth tables included; a one-shot `migrate` service runs `dbmate --wait up` before the app starts. `db/schema.sql` is dbmate's dump of the result.
- All columns are `geography`, so `ST_DWithin` / `ST_Distance` work in **metres**. `ST_X`/`ST_Y` need a `::geometry` cast.

## Seed

- Zones are **land-only** polygons cut from OpenStreetMap coastline (ODbL, credited in README). The sea is outside the service area.
- Points and reports are generated on land with `ST_GeneratePoints(union_of_zones, n, seed)` (seeds 42 / 7) plus `setseed(0.42)`: identical data after each `make reset` + `make seed`, but dates shift with `now()`. `db/seed.sql` refuses to run when `zones` has rows.
- Benchmark spot: lng 22.95, lat 40.64 (Kentro). README has the EXPLAIN results.

## Auth and roles

- Better Auth with `admin` (RBAC), `organization`, and `twoFactor` plugins; email + password.
- Roles in `shared/utils/permissions.ts`: `user` (report:create), `moderator` and `admin` (report:create/update/delete/moderate; admin also gets Better Auth admin statements).
- Pages: `definePageMeta({ roles: [...] })` checked by `auth.global.ts`. API: `requireSession` / `requirePermission(event, { report: ["update"] })` in every handler.
- The admin is seeded on every start from `ADMIN_EMAIL` / `ADMIN_PASSWORD`; changing `.env` does not update an existing admin.

## Why it looks like this

- **Raw SQL on purpose:** the project exists to learn SQL and PostGIS; queries are written and EXPLAINed by hand in `db/queries/` before they move into handlers.
- **Docker for everything:** `node_modules` lives in a named volume (Linux binaries) and the container runs as the host uid, so the same setup works on Linux, macOS, and WSL2.
- **TypeScript pinned to `^6`:** TypeScript 7 (native) breaks `vue-tsc`.
