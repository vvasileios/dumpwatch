# dumpwatch

Nuxt 4 + Nitro + PostgreSQL/PostGIS (raw SQL via `pg`) + Leaflet + Tailwind + Better Auth. Runs in Docker Compose.

## Setup

Needs Docker (Desktop on Mac/Windows) and `make`. Node on the host is optional.
On Windows, keep the repo inside WSL2 (not under `C:\`), or hot reload won't see file changes.

```sh
cp .env.example .env
# set BETTER_AUTH_SECRET in .env:  openssl rand -base64 32
make up
```

Opens http://localhost:3000. Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` (the admin is created on startup).

## Make targets

| target                 | does                                              |
| ---------------------- | ------------------------------------------------- |
| `make up` / `down`     | start / stop the stack                            |
| `make logs`            | follow logs                                       |
| `make sh`              | shell in the app container                        |
| `make psql`            | psql into the database                            |
| `make install pkg=foo` | add an npm package (use this, not host `npm i`)   |
| `make reset`           | delete DB + node_modules volumes (all data lost)  |

## Layout

- `app/pages/` — routes (`login.vue`, `index.vue` map); `app/middleware/auth.global.ts` redirects to `/login` when signed out
- `app/components/` — `MapView.client.vue` (Leaflet), `AppLoader.vue` (shared loader)
- `server/api/` — Nitro routes; `server/api/auth/[...all].ts` is Better Auth
- `server/utils/` — `db()` pg pool, `auth` + `requirePermission(event, { report: ["delete"] })`
- `server/plugins/auth-bootstrap.ts` — creates auth tables and seeds the admin on startup
- `shared/utils/permissions.ts` — roles and permissions (used by client and server)
- `db/init/` — SQL run only on a fresh database; after changing it, `make reset`

## Database

Connect any client to `localhost:5432` with the `POSTGRES_*` values from `.env` (default `dumpwatch`).
PostGIS takes `(lng, lat)`; Leaflet takes `[lat, lng]`.

## Spatial query benchmarks

Query 1 (collection points within 500 m of a spot, closest 20) on 50,000 points, plus two variants.
Warm session, JIT off. Run with `make -s sql f=db/queries/05_explain_nearby.sql` (and `06`, `07`); plans are in `db/explain/`.

| Query | Plan | Rows checked | Time |
| --- | --- | --- | --- |
| `ST_DWithin(location, p, 500)` with GiST index | Bitmap Index Scan | 1,301 | 1.5 ms |
| `ST_DWithin(location, p, 500)` without index | Seq Scan | 50,000 | 33 ms |
| `ST_Distance(location, p) < 500` with GiST index | Seq Scan | 50,000 | 35 ms |
| `ORDER BY location <-> p LIMIT 20` (KNN, no radius) | Index Scan, Order By | 20 | 0.1 ms |

- `ST_DWithin` uses the index: a bounding-box check finds candidates, then the exact distance check runs on those only.
- `ST_Distance(...) < x` can't use the index, so it scans every row even when the index exists.
- KNN is fastest but has no radius: it always returns 20 points, however far away.

<details>
<summary>Query 1 plan with the GiST index</summary>

```
 Limit  (cost=16380.03..16380.04 rows=5 width=41) (actual time=1.527..1.529 rows=20.00 loops=1)
   Buffers: shared hit=510
   ->  Sort  (cost=16380.03..16380.04 rows=5 width=41) (actual time=1.527..1.527 rows=20.00 loops=1)
         Sort Key: (st_distance(location, '0101000020E6100000713D0AD7A3F03640713D0AD7A3504440'::geography, true))
         Sort Method: top-N heapsort  Memory: 27kB
         Buffers: shared hit=510
         ->  Bitmap Heap Scan on collection_points  (cost=49.84..16379.97 rows=5 width=41) (actual time=0.152..1.447 rows=777.00 loops=1)
               Filter: st_dwithin(location, '0101000020E6100000713D0AD7A3F03640713D0AD7A3504440'::geography, '500'::double precision, true)
               Rows Removed by Filter: 524
               Heap Blocks: exact=482
               Buffers: shared hit=510
               ->  Bitmap Index Scan on collection_points_location_gix  (cost=0.00..49.84 rows=1258 width=0) (actual time=0.120..0.120 rows=1301.00 loops=1)
                     Index Cond: (location && _st_expand('0101000020E6100000713D0AD7A3F03640713D0AD7A3504440'::geography, '500'::double precision))
                     Index Searches: 1
                     Buffers: shared hit=28
 Planning Time: 0.478 ms
 Execution Time: 1.545 ms
```
</details>

<details>
<summary>Query 1 plan without the GiST index</summary>

```
 Limit  (cost=626092.61..626092.62 rows=5 width=41) (actual time=33.091..33.093 rows=20.00 loops=1)
   Buffers: shared hit=530
   ->  Sort  (cost=626092.61..626092.62 rows=5 width=41) (actual time=33.091..33.092 rows=20.00 loops=1)
         Sort Key: (st_distance(location, '0101000020E6100000713D0AD7A3F03640713D0AD7A3504440'::geography, true))
         Sort Method: top-N heapsort  Memory: 27kB
         Buffers: shared hit=530
         ->  Seq Scan on collection_points  (cost=0.00..626092.55 rows=5 width=41) (actual time=0.060..33.004 rows=777.00 loops=1)
               Filter: st_dwithin(location, '0101000020E6100000713D0AD7A3F03640713D0AD7A3504440'::geography, '500'::double precision, true)
               Rows Removed by Filter: 49223
               Buffers: shared hit=530
 Planning Time: 0.087 ms
 Execution Time: 33.104 ms
```
</details>

## Editor types

`node_modules` lives in a Docker volume. For editor autocomplete, run `npm install` on the host once (optional).
