# Design: municipalities, contractors and roles (multi-tenancy)

Status: **proposed, not built.** Written so the decisions and the order of work aren't lost.

## Why

Today dumpwatch serves one city with three global roles (`user`, `moderator`, `admin`). Every staff member sees every report. Real use looks different:

- Several **municipalities** each own a service area, their collection points and their staff.
- **Contractor companies** do the cleanups. One contractor can work for several municipalities, in some of their zones.
- **Citizens** belong to nobody. They report wherever they are, and the location decides which municipality gets the report.

## Actors and roles

| Organisation | Role | Can |
| --- | --- | --- |
| Platform | Platform admin | Create municipalities and contractors, support access |
| Municipality | Owner / admin | Manage members, zones, collection points, contracts |
| Municipality | Dispatcher | Triage reports in their area, assign them to a contractor, change status |
| Municipality | Viewer | Read dashboards and reports |
| Contractor | Manager | See jobs assigned to the company, hand them to workers |
| Contractor | Worker | See own jobs, mark them cleared (later: with a photo) |
| none | Citizen | Report anywhere inside a service area, see their own reports |

A person can be a member of several organisations (e.g. a consultant), and picks one as the **active organisation**, like switching workspaces.

## Building blocks we already have

- **Better Auth organization plugin** (already installed): `organization`, `member` (with a role), `invitation`, and `session.activeOrganizationId`. It supports custom roles and permissions per organisation through the same access-control API we use for the global roles.
- **Zones as polygons** and `ST_Covers` routing: a point already resolves to its zone.
- **dbmate migrations** for the schema changes, and **API tests** to prove isolation.

## Data model

```
organization (Better Auth)                tenant
  id, name, slug        ◄──────────────── organization_id PK, kind: 'municipality' | 'contractor'

zones               + municipality_id → organization(id)
collection_points   + municipality_id → organization(id)
dump_reports        + municipality_id → organization(id)   (set from the covering zone on insert)

contract                                  which contractor serves which zone, and when
  municipality_id, contractor_id, zone_id, valid_from, valid_to

report_assignment                         one active assignment per report
  report_id, contractor_id, worker_id NULL, assigned_by, assigned_at, accepted_at, cleared_at

report_event                              append-only history: status changes, assignments, who and when
```

- `tenant.kind` lives in our own table (not Better Auth's `metadata` text) so it can be constrained and joined in SQL.
- A report's `municipality_id` is **derived**, never sent by the client: `INSERT … SELECT … FROM zones WHERE ST_Covers(boundary, $point)`. No covering zone is still a 422.
- **Zones of different municipalities must not overlap.** A GiST exclusion constraint (`EXCLUDE USING gist (boundary WITH &&)`) only compares bounding boxes, which is too strict, so this needs a trigger using `ST_Overlaps` / `ST_Intersects` on interiors. Shared edges are allowed (already a known edge case in the zone stats).
- Status grows from `open → assigned → cleared` to `open → assigned → in_progress → cleared`, with every change written to `report_event`.

## Authorisation in two layers

**1. In the app (what we do today, scoped):** every handler checks the permission **in the active organisation** (Better Auth's organisation `hasPermission`), and every query filters by that organisation.

**2. In the database (the safety net): Postgres row-level security.** One forgotten `WHERE municipality_id = …` would leak another city's data, so the database enforces it too:

- The app connects as a non-owner role, `dumpwatch_app`. RLS doesn't apply to table owners unless `FORCE ROW LEVEL SECURITY` is set. This is the "least-privilege DB role" item from PROGRESS.
- Each request runs in a transaction that first calls `SELECT set_config('app.org_id', $1, true), set_config('app.user_id', $2, true)`. `true` means **local to the transaction**, which matters with a connection pool: the value can't leak to the next request on the same connection. A `withTenant(event, fn)` helper owns this.
- Policies, for example:
  - municipality staff: `USING (municipality_id = current_setting('app.org_id'))`
  - contractor staff: `USING (EXISTS (SELECT 1 FROM report_assignment a WHERE a.report_id = id AND a.contractor_id = current_setting('app.org_id')))`
  - citizens: `USING (reported_by = current_setting('app.user_id'))`
- Keep policy predicates simple and indexed (`municipality_id`, `(report_id)` on assignments), and EXPLAIN the list queries again with RLS on.
- Admin tools (seed manager, migrations) run as the owner role, outside RLS.

## How some flows change

- **Citizen reports a dump:** unchanged UI. The server finds the covering zone, stores its municipality, and the report shows up for that municipality's dispatchers only.
- **Dispatcher** opens `/reports`: only their municipality's reports. They assign one to a contractor that has a valid contract for that zone.
- **Contractor worker** opens a "My jobs" page: only reports assigned to them. Clearing a job sets `cleared_at` and writes an event.
- **Dashboards** (`/zones`, hotspots) show the active municipality's zones only. The zone stats query stays the same with an extra filter.

## Rollout plan (expand, migrate, contract)

1. **Expand:** migration adds `tenant`, nullable `municipality_id` columns with indexes, `contract`, `report_assignment`, `report_event`.
2. **Backfill:** create the "Thessaloniki" municipality; set `municipality_id` on zones and points; set reports from their covering zone. Verify there are no NULLs left, then make the columns `NOT NULL` with foreign keys.
3. **App scoping:** active organisation required for staff pages; every staff query filtered; organisation roles replace `moderator`. API tests prove that a dispatcher in municipality A gets nothing from B (lists, single report by id, stats, hotspots).
4. **RLS:** create `dumpwatch_app`, enable and force RLS, add policies, route requests through `withTenant`. Repeat the isolation tests, plus tests that run SQL as `dumpwatch_app` directly.
5. **Contractors:** contracts, assignment, the worker's job list, report history.
6. **Contract:** drop the global `moderator` role once nothing uses it.

The seed manager gains "sample municipality" and "sample contractor" entries instead of being redesigned.

## Alternatives considered

| Option | Why not (for now) |
| --- | --- |
| Database or schema per tenant | Strong isolation, but contractors work across municipalities, so cross-tenant queries become hard; migrations and pooling multiply per tenant. |
| App-level filtering only, no RLS | Simplest, but one missed `WHERE` is a data leak. RLS costs little once the transaction helper exists. |
| Roles stored only in our own tables | Better Auth already has organisations, members, invitations and the active organisation on the session; reuse it. |

## Open questions

- Can citizens report anonymously, or always signed in?
- Do municipalities want a public, read-only dashboard?
- Should contractors see the citizen's description and photos, or a cleaned-up job card?
- SLAs (time to clear per contract) and reporting on them.
- Data retention for cleared reports and deleted users.
