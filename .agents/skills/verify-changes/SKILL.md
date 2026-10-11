---
name: verify-changes
description: Verify or review dumpwatch changes by running them - typecheck, curl every endpoint and edge case with temporary users, check rows in psql, and drive pages in headless Chromium - then report a pass/fail table and clean up. Use when reviewing code the user built, before a commit, or when asked to test or check a change.
---

# Verify changes

Reading code is not a review. Run it.

## 0. Prerequisites

- Stack running: `docker compose ps` shows `app` and `db` up (otherwise ask the user to run `make up`).
- Never `make reset` or drop data to make a test pass.

## 1. Pick checks by what changed

| Changed | Run |
| --- | --- |
| Any `.ts` / `.vue` | `make typecheck` |
| `server/api/**` | API checks (step 2) |
| SQL / `db/queries` | `make sql f=...`, results in `make psql` |
| `app/pages`, components, composables | browser checks (step 3) |
| `db/migrations` | `make migrate`, then `make rollback` + `make migrate` (down works); check `db/schema.sql` diff |
| Docs only | check links and paths exist |

## 2. API checks

Temporary users (use a unique suffix and remember the emails):

```sh
B=http://localhost:3000; J=$(mktemp -d)
curl -s -c $J/user -H "Origin: $B" -H 'content-type: application/json' \
  -d '{"email":"t-user-1@test.local","password":"testpass123","name":"T"}' $B/api/auth/sign-up/email
curl -s -c $J/mod -H "Origin: $B" -H 'content-type: application/json' \
  -d '{"email":"t-mod-1@test.local","password":"testpass123","name":"T"}' $B/api/auth/sign-up/email
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' <<'SQL'
UPDATE "user" SET role = 'moderator' WHERE email = 't-mod-1@test.local';
SQL
curl -s -b $J/mod -w ' %{http_code}\n' "$B/api/reports/list"
```

For each endpoint check, as relevant:

- 401 without a cookie; 403 with the wrong role.
- 400 for each invalid field (missing, wrong type, out of range, too long, id with 19 digits) and that `data` lists field errors.
- 404 for a missing id; 422 for a point outside the service area (sea, swapped lat/lng).
- Happy path: status code, response shape, ids as strings, coordinates in the right order.
- Side effects in `make psql` (row written, constraints like `cleared_at` consistent).
- Concurrency-sensitive flows: fire two requests and check the result.

## 3. Browser checks

Headless Chromium with the DevTools protocol:

1. Sign in a temp user (step 2) and read its `better-auth.session_token` from the cookie jar.
2. Start Chromium with `--headless=new --remote-debugging-port=9222`, set the cookie with `Network.setCookie` for `localhost`.
3. `Page.navigate`, wait for load, read the DOM with `Runtime.evaluate`.
4. Click with `Input.dispatchMouseEvent`; check what changed.
5. Also fetch the page with `curl -b` to check the SSR HTML (hydration bugs show as SSR vs client differences).
6. Check as `user` and as `moderator` when the page or nav depends on role.

## 4. Clean up

```sh
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' <<'SQL'
DELETE FROM dump_reports WHERE reported_by IN (SELECT id FROM "user" WHERE email LIKE 't-%@test.local');
DELETE FROM "user" WHERE email LIKE 't-%@test.local';
SQL
```

Better Auth sessions and accounts cascade from `"user"`. Remove the cookie jar and stop Chromium.

## 5. Report

A table: check, expected, actual, pass/fail. For every failure, explain **why** it happens (the mechanism, not only the symptom) and the smallest fix. List what wasn't run and why. Don't fix findings unless the user said "fix all".
