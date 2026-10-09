# dumpwatch

Nuxt 4 + Nitro + PostgreSQL/PostGIS (raw SQL via `pg`) + Leaflet. Runs in Docker Compose.

## Run

Needs only Docker (Desktop on Mac/Windows) and `make`. Node on the host is optional.
On Windows, clone and run the repo inside WSL2 (not under `C:\`), or hot reload won't see file changes.

```sh
cp .env.example .env   # optional, defaults match
make up                # app http://localhost:3000, Postgres localhost:5432
make logs
```

## Make targets

| target                 | does                                                             |
| ---------------------- | ---------------------------------------------------------------- |
| `make up` / `down`     | start / stop the stack                                           |
| `make logs`            | follow logs                                                      |
| `make sh`              | shell in the app container                                       |
| `make psql`            | psql into the database                                           |
| `make install pkg=foo` | add an npm package (always use this, not host `npm install foo`) |
| `make reset`           | stop and delete DB + node_modules volumes                        |

## Layout

- `app/` — Vue side (`MapView.client.vue` is the Leaflet map, client-only)
- `server/api/` — Nitro routes; `GET /api/health` checks the DB
- `server/utils/db.ts` — shared `pg` pool, auto-imported as `db()`
- `db/init/` — SQL run once on first DB init (enables PostGIS). After changing it, `make reset`.

## Editor types

The app's `node_modules` lives in a Docker volume. For editor autocomplete, run `npm install` on the host once (optional, needs Node). `make install` refreshes it automatically.

## Database

Connect any client to `localhost:5432`, user/password/database `dumpwatch` (or your `.env` values).
