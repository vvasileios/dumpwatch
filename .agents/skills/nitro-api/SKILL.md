---
name: nitro-api
description: Create or change a single Nitro API endpoint in dumpwatch (server/api/**) with auth guard, Zod validation, parameterized SQL, and the project's error contract. Use when adding or modifying one handler, its validation, or its permissions. For a full page + composable + API slice use nuxt-feature instead.
---

# Nitro API endpoint

Hard rules (auth, validation, error codes, coordinate order) are in `AGENTS.md` under "API rules" and "SQL and PostGIS rules". This is the workflow.

## 1. Pick the file and the guard

- File route under `server/api/`: `stats/zones.get.ts`, `reports/[id].patch.ts`. Method suffix is required.
- First line of the handler: `await requireSession(event)` (any signed-in user) or `await requirePermission(event, { report: ["update"] })`.
- New permission? Add it to the `ac` statement and the roles in `shared/utils/permissions.ts`, so the client and server share one source.
- For "own vs all" data, follow `server/api/reports/list.get.ts`: `hasPermission(session, { report: ["moderate"] })` and pass `null` for the owner filter when staff.

## 2. Validate input

```ts
const { id } = await getValidatedRouterParams(
    event,
    z.object({ id: z.string().regex(/^\d{1,18}$/) }).parse,
);
const { status } = await getValidatedQuery(
    event,
    z.object({ status: z.enum(REPORT_STATUSES).optional() }).parse,
);
```

- Numbers in the query string: copy `numberParam` from `server/api/points/nearby.get.ts` (string, regex, transform, pipe).
- Coordinates: `lat` in [-90, 90], `lng` in [-180, 180]; bboxes need min < max and a span limit (`server/api/reports.get.ts`).
- Body where the client needs field errors: `safeParse(await readBody(event))`, then throw 400 with `data: z.flattenError(result.error).fieldErrors` (`server/api/reports.post.ts`).
- Limits that the UI also shows go in `shared/utils/*.ts`, not inline.

## 3. Query

- SQL as a module-level `const` string, `$n` parameters, `db().query<RowType>(SQL, [...])`.
- Prove the query first in `db/queries/NN_name.sql` with `make sql f=...` when it is new or spatial (see `postgis-queries`).
- Return coordinates as `ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng`.
- Remember `bigint` / `numeric` / `count(*)` come back as strings; `interval` comes back as an object. Cast in SQL (`::int`, `extract(epoch from ...)`) or type them as strings.
- Point writes: check `isInServiceArea(lng, lat)` and throw 422 when outside.
- Update/delete by id: zero rows means 404.
- Multi-statement writes: `const client = await db().connect()` with `BEGIN` / `COMMIT` / `ROLLBACK` in `try/finally { client.release() }`. No handler needs this yet; don't add it for single statements.

## 4. Type the response

- Response type in `shared/types/` and the handler signature `defineEventHandler(async (event): Promise<T> => ...)`.
- Status 201 for creates: `setResponseStatus(event, 201)`.

## 5. Verify

Run the `verify-changes` skill's API checklist: 401 without a cookie, 403 with the wrong role, 400 with each bad field, 404 / 422 where they apply, then the happy path. Check the row in `make psql`.

Result: one handler file, optional shared type/limit, a passing `make typecheck`, and a pass/fail table of curl checks.
