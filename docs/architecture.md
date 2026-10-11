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
  pages/index.vue              map + nearby panel (slice 6) + reports layer (7c)
  pages/reports/new.vue        report form (7b)
  pages/reports/index.vue      report list (7d): own for citizens, all + status select for staff; one-shot "Report sent" banner
  pages/collection-points.vue, zones.vue   staff-only placeholders (roles via definePageMeta)
  pages/login.vue              layout: false
  layouts/default.vue          menubar + window frame (maximize = full-bleed)
  middleware/auth.global.ts    fetches session → useState("session"); redirects; checks meta.roles
  composables/useNearby.ts     nearby state + fetch (abort, request counter)
  composables/useReportList.ts list state: first page via useFetch (SSR), Load more via $fetch keyset cursor, PATCH status
  composables/useReports.ts    reports layer: watch [show, bbox] → 300 ms debounce → fetch (abort); span guard
  composables/useLeafletMap.ts shared Leaflet setup (tiles, view, zoom, unmount-safe, ResizeObserver)
  components/                  MapView.client.vue, LocationPicker.client.vue, NearbyPanel.vue,
                               ReportsLayerCard.vue (v-model:show), AppMenubar.vue,
                               AppCommandPalette.vue (Cmd/Ctrl+K), AppLoader.vue, AppEmptyState.vue
  components/shared/           UI kit, auto-imported as <SharedX>: Button (primary/secondary/ghost,
                               `to` renders NuxtLink, `loading`/`icon`), IconButton (required label),
                               Field (label), Input (trailing slot), Textarea, Select (typed options),
                               Checkbox; all form controls use v-model (defineModel)
  utils/                       nav.ts (one nav list, role-filtered), auth-client.ts, point-types.ts,
                               report-status.ts (reportStatusColors), field.ts (fieldClass: shared
                               border/focus/invalid styles for inputs, textareas, selects)
  types/page-meta.d.ts         PageMeta.roles / title
server/
  api/auth/[...all].ts         Better Auth handler
  api/health.get.ts
  api/points/nearby.get.ts     query 1 + service-area guard
  api/reports.get.ts           bbox query (&& envelope), span-limited
  api/reports.post.ts          create, 422 outside service area
  api/reports/[id].patch.ts    status change, keeps cleared_at consistent
  api/reports/list.get.ts      keyset paging; own vs all via report:moderate; returns canModerate
  utils/db.ts                  lazy pg Pool from runtimeConfig.databaseUrl
  utils/auth.ts                auth, requireSession, requirePermission, hasPermission
  utils/geo.ts                 isInServiceArea (ST_Covers on zones)
  plugins/auth-bootstrap.ts    Better Auth migrations + admin seed on every start
shared/
  types/collection-point.ts, report.ts (DumpReport, ReportStatus, Bbox tuple)
  utils/permissions.ts         ac + roles: user / moderator / admin
  utils/nearby.ts, reports.ts  limits shared by client and server
db/
  init/001_extensions.sql, 002_schema.sql, 003_seed.sql   run ONLY on a fresh DB
  queries/01-04                core queries
  queries/05-07                EXPLAIN experiments (index on/off inside a rolled-back txn)
  queries/08                   report list paging on 100k rows (rolled-back txn)
  explain/                     saved plans
```

## Data model

- `zones(boundary geography(Polygon, 4326))`
- `collection_points(location geography(Point, 4326), type, fill_level 0–100)`
- `dump_reports(location geography(Point, 4326), description, status, reported_by text, reported_at, cleared_at)`
- Indexes: GiST on both `location` columns; list B-trees `(reported_at, id)`, `(status, reported_at, id)`, `(reported_by, reported_at, id)`.
- Constraints: `status IN (open, assigned, cleared)`; `(status = 'cleared') = (cleared_at IS NOT NULL)`; `cleared_at >= reported_at`; description 5–1000 chars.
- `reported_by` has **no FK**: Better Auth creates its `"user"` table from the app (`auth-bootstrap.ts`) after `db/init` has run. Migrations would fix this.
- All columns are `geography`, so `ST_DWithin` / `ST_Distance` work in **metres**. `ST_X`/`ST_Y` need a `::geometry` cast.

## Seed

- Zones are **land-only** polygons cut from OpenStreetMap coastline (ODbL, credited in README). The sea is outside the service area.
- Points and reports are generated on land with `ST_GeneratePoints(union_of_zones, n, seed)` (seeds 42 / 7) plus `setseed(0.42)`: identical data after each `make reset`, but dates shift with `now()`.
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
