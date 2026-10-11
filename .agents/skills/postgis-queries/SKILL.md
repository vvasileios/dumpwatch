---
name: postgis-queries
description: Write, review, or benchmark PostGIS/PostgreSQL queries in dumpwatch (db/queries, SQL inside server/api), including geography vs geometry, coordinate order, distance units, GiST/B-tree indexes, and EXPLAIN experiments. Use when creating or changing spatial SQL, changing db/init schema or indexes, or investigating query correctness or speed.
---

# PostGIS queries

## 1. Check the schema

- Schema and indexes: `db/init/002_schema.sql`. Seed: `db/init/003_seed.sql`.
- All spatial columns are `geography(Point|Polygon, 4326)`: lon/lat on WGS84, distances in **metres**, no `ST_Transform` needed.
- `ST_SetSRID` labels a geometry with an SRID; `ST_Transform` reprojects. Input here is already WGS84, so only `ST_SetSRID(..., 4326)` is ever right.
- `ST_X` / `ST_Y` take geometry: `ST_X(location::geometry)`.

## 2. Pick the operator

| Need | Use | Index |
| --- | --- | --- |
| Within N metres | `ST_DWithin(location, p, $m)` | GiST |
| Closest N, no radius | `ORDER BY location <-> p LIMIT n` | GiST (KNN) |
| Closest per row | `CROSS JOIN LATERAL (... ORDER BY <-> LIMIT 1)` (`02_nearest_per_report.sql`) | GiST |
| In a bbox | `location && ST_MakeEnvelope(minLng, minLat, maxLng, maxLat, 4326)::geography` | GiST |
| Point in zone | `ST_Covers(boundary, location)` (includes the edge) | GiST on `location`; `zones` is small and has none |
| Exact distance for display | `ST_Distance(a, b)` in SELECT only | none |

Never filter with `ST_Distance(...) < x`: it can't use the index (README benchmark: 36 ms seq scan vs 2.1 ms).

## 3. Write it

- Point from parameters: `ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography` with `$1 = lng`, `$2 = lat`.
- Parameterize everything, including radius and limit.
- Keyset paging, not OFFSET: `(reported_at, id) < (cursor row)` with a matching `(…, reported_at, id)` B-tree (`08_report_list.sql`).
- Prototype in `db/queries/NN_name.sql` (next free number), run with `make sql f=db/queries/NN_name.sql`.

## 4. Correctness checks

Run these against the seeded data, with the Kentro spot lng 22.95, lat 40.64:

- **Swapped coordinates:** run with `(40.64, 22.95)`; it should return nothing or fail the service-area check, never plausible rows.
- **Sea / outside zones:** a point in the Thermaikos gulf (e.g. lng 22.90, lat 40.60) is outside the service area.
- **Zone edge:** `ST_Covers` includes boundary points, `ST_Contains` does not; pick on purpose.
- **Radius limits:** smallest and largest allowed radius; empty result.
- **NULLs:** `description`, `fill_level`, `cleared_at`, `reported_by` are nullable; aggregates with `FILTER` and `LEFT JOIN` must keep zones with zero reports.
- **Antimeridian / poles:** irrelevant for this city; don't add handling.

## 5. Performance (only when it matters)

Follow `db/queries/05_explain_nearby.sql`:

1. `SET jit = off;` and `PREPARE` the query.
2. Warm it once with output to `\o /dev/null`.
3. `EXPLAIN (ANALYZE, BUFFERS) EXECUTE ...`.
4. Compare variants (index dropped, more rows) **inside `BEGIN; ... ROLLBACK;`** so nothing persists.
5. Save the plan to `db/explain/qN_name.txt`; add one row to the README benchmark table only if the user wants it.

## 6. Schema or index changes

- Edit `db/init/002_schema.sql` (and the seed if needed). These files run only on a fresh database.
- Applying them needs `make reset`, which **deletes all data**. Never run it yourself; tell the user.
- Prefer a constraint in the schema over a check in app code (see the existing `CHECK`s).
- `reported_by` must stay without an FK until migrations exist (Better Auth creates `"user"` later).

Result: a query that passes the correctness checks, uses the intended index (shown by EXPLAIN when performance was in question), and is ready to paste into a handler.
