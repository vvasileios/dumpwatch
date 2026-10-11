# dumpwatch

Citizens report illegal dumping on a map; the city sees nearby collection points and a dashboard per zone.
A learning project built slice by slice from a spec. **Raw SQL with `pg` on purpose: never add an ORM or query builder.**

- Where the build is and what's next: [docs/PROGRESS.md](docs/PROGRESS.md). Read it at the start of a session, update it at the end.
- File map, data model, auth, design rationale: [docs/architecture.md](docs/architecture.md).

## Stack

Exact versions: `package.json` / `package-lock.json`. Check them before relying on an API.

Nuxt 4 (Nitro 2, h3 1) · Vue 3 · TypeScript `^6` (pinned: TS 7 breaks `vue-tsc`) · PostgreSQL 18 + PostGIS 3.6 (`postgis/postgis:18-3.6`) · `pg` 8 · Zod 4 · Better Auth 1 · Leaflet 1.9 · Tailwind CSS 4 via `@tailwindcss/vite` (no config file; `app/assets/css/main.css` is `@import "tailwindcss"`) · `@nuxt/icon` with a local Lucide bundle · Node 24 in Docker · npm (`package-lock.json`).

## Working with the user

- The user is learning. Default per slice: **write a step-by-step guide, the user builds, the agent reviews by running the code**. Implement only when told "build it" or "fix all", then explain the flow file by file.
- Reviews: run every endpoint and edge case, report a pass/fail table, explain *why* each bug happens, clean up test data afterwards. See the `verify-changes` skill.
- Ask before fixing review findings unless told "fix all".
- Keep README edits minimal. **No code comments** (removed on purpose).

## Commands

Everything runs in Docker through `make`; don't run `npm install` or `nuxt dev` on the host.

```sh
cp .env.example .env          # set BETTER_AUTH_SECRET: openssl rand -base64 32
make up                       # build, start, wait for http://localhost:3000
make down | logs | sh | psql
make install pkg="foo"        # the only way to add a package
make sql f=db/queries/01_nearby.sql   # run a SQL file (ON_ERROR_STOP)
make typecheck                # nuxt typecheck (vue-tsc); run before every commit
make reset                    # DESTRUCTIVE: deletes DB and node_modules volumes
```

- App `127.0.0.1:3000`, Postgres `127.0.0.1:5432` (`dumpwatch`/`dumpwatch`), Node inspector `127.0.0.1:9229`.
- There is no lint, test, or CI setup. `make typecheck` plus running the code is the verification.
- Never run `make reset`, `docker compose down -v`, or destructive SQL without the user's explicit go-ahead.

## Where code goes

| Concern | Location |
| --- | --- |
| Routes | `app/pages/`; staff-only via `definePageMeta({ roles: ["moderator", "admin"] })` |
| Client state and fetching | one composable per feature in `app/composables/` |
| UI | `app/components/` draw state and emit events; `.client.vue` for Leaflet |
| Client-only helpers | `app/utils/` (nav list is `app/utils/nav.ts`) |
| API | `server/api/**` file routes (`name.get.ts`, `[id].patch.ts`); SQL lives in the handler as a `const` string |
| Server helpers | `server/utils/` (`db()`, auth guards, `isInServiceArea`) |
| Types and limits used on both sides | `shared/types/`, `shared/utils/` |
| Schema and seed | `db/init/` (fresh DB only) |
| Hand-written and EXPLAIN queries | `db/queries/NN_name.sql`, saved plans in `db/explain/` |

`server/utils` is auto-imported only in Nitro, but its types leak into the app typecheck: client code that uses it passes `make typecheck` and crashes at runtime. Put client helpers in `app/utils`, shared ones in `shared/utils`.

## Conventions

- 4-space indent, double quotes, semicolons. The user's formatter may reflow files.
- `<script setup lang="ts">`, Composition API.
- Don't name types after DOM globals (`Report`, `Event`, `Location`): the browser type wins in `app/`. Existing names: `DumpReport`, `NearbyPoint`.
- Shared limits (`REPORTS_PAGE_SIZE`, `REPORT_DESCRIPTION`, …) live in `shared/utils` and are used by both the Zod schema and the UI.

## API rules

- Every handler starts with `requireSession(event)` or `requirePermission(event, { report: ["…"] })`. `auth.global.ts` protects pages only.
- Better Auth `auth.api.userHasPermission` returns `{ success }`, not a boolean; use `hasPermission`.
- Validate all input with Zod: `getValidatedQuery` / `getValidatedRouterParams` / `readValidatedBody`. For custom 400 `data`, use `schema.safeParse(await readBody(event))` and throw yourself (`readValidatedBody` wraps validator errors).
- Query params are strings: `z.string().regex(...).transform(Number).pipe(z.number()...)`. Don't use `z.coerce` (its `unknown` input breaks `.pipe` typing).
- Ids from URLs: `/^\d{1,18}$/` (longer values overflow `bigint` and surface as 500).
- Error contract: 400 `data` = `z.flattenError(err).fieldErrors`; 401 no session; 403 role; 404 missing; 422 outside the service area. The client reads `FetchError.data.data`.
- `pg` returns `bigint` (ids, `count(*)`) and `numeric` as **strings**: types use `id: string`.
- Secrets stay server-side: `runtimeConfig.databaseUrl` (env `NUXT_DATABASE_URL`), `BETTER_AUTH_SECRET`. Never expose them via `runtimeConfig.public`.

## SQL and PostGIS rules

- Parameterized queries only (`$1, $2`); never interpolate values into SQL.
- All spatial columns are `geography(…, 4326)`: distances are **metres**. Build points with `ST_SetSRID(ST_MakePoint($lng, $lat), 4326)::geography`.
- **Coordinate order:** PostGIS `ST_MakePoint(lng, lat)`, `ST_MakeEnvelope(minLng, minLat, maxLng, maxLat, 4326)`; Leaflet `[lat, lng]`. Parameter arrays are always `[lng, lat, …]`.
- Radius filters use `ST_DWithin` (index-backed), never `ST_Distance(...) < x`. KNN `<->` for "closest N".
- Points must be inside the service area (`isInServiceArea`); the sea is outside.
- Schema changes: edit `db/init/` and ask the user to run `make reset` (wipes data). There are no migrations yet. See the `postgis-queries` skill for EXPLAIN work.

## Frontend rules

- Data needed for the first render: `useFetch` (SSR). User-triggered requests: `$fetch` with an `AbortController`.
- Composables with `useFetch`: call it without `await`, register `watch`/hooks synchronously, then `await` the fetch at the end and seed local state from `data`. Hooks after an `await` lose the component instance; watchers never run during SSR.
- Late async results (fetch, geolocation) must check they are still wanted (AbortController, request counter, or compare the starting value).
- Inside a `watch`, never write the refs it watches. `stop()` cancels work only; it doesn't reset state.
- Props are read-only: two-way state uses `defineModel`.
- "Something happened" confirmations come from app state (`useState`), never the URL.
- `.client.vue` components render after mount: `await nextTick()` before touching template refs.
- Leaflet: `circleMarker` (default pin images break with Vite); popups via `textContent` (XSS); `bubblingMouseEvents: false` on markers; `latlng.wrap()`. `moveend` doesn't fire for the initial view: emit bounds once in `onReady`. Container resizes need `invalidateSize()` (`useLeafletMap` has a `ResizeObserver`).
- Accessibility: `aria-live` only for errors and state changes, not on every pan. `AppLoader` without `label` is decorative; pass `label` only when no visible text says the same.
- Tailwind utility classes in templates; reuse `AppLoader`, `AppEmptyState`, `reportStatusColors`, and Lucide icons (`lucide:name`).

## Before you finish

- Code change: `make typecheck`, then run what you changed (curl / psql / browser). Report what you ran and what you couldn't.
- `db/init` change: tell the user it needs `make reset`; the first start after a reset logs one harmless Better Auth "Database schema mismatch".
- Added a route, composable, component, endpoint, or table: update [docs/architecture.md](docs/architecture.md).
- Remove test users and reports you created.
- End of session: update [docs/PROGRESS.md](docs/PROGRESS.md).

## Maintaining these files

- Rule that applies across the codebase: the matching section of this file. Keep it one line.
- Only needed inside one workflow: that skill's `SKILL.md`.
- Design, data model, rationale: `docs/architecture.md`. Progress and debt: `docs/PROGRESS.md`.
- New skill: create `.agents/skills/<name>/SKILL.md` (`name` must equal the folder name), then `make skills` to link it into `.claude/skills/` for Claude Code.
