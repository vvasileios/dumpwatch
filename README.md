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

## Editor types

`node_modules` lives in a Docker volume. For editor autocomplete, run `npm install` on the host once (optional).
