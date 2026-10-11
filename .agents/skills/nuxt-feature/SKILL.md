---
name: nuxt-feature
description: Plan and build a vertical feature slice in dumpwatch across page, composable, components, shared types, and Nitro API (e.g. the /zones dashboard or nearest collection point per report). Use when a task spans app/ and server/ together or the user asks for a slice guide. Not for a single endpoint (nitro-api) or a single SQL query (postgis-queries).
---

# Nuxt feature slice

## 0. Guide or build?

Default is **guide mode**: write numbered steps the user will type themselves, each with the file path, what to write, and a "what to watch" note (the trap that step hides). Only write the code when the user says "build it". After building, walk through the flow file by file.

## 1. Plan from the bottom up

1. **SQL**: prove the query in `db/queries/` (`postgis-queries`).
2. **API**: one handler per resource (`nitro-api`). Decide the guard and the response type in `shared/types/`.
3. **Composable**: `app/composables/useThing.ts` owns all state, fetching, and errors.
4. **Page**: `app/pages/thing.vue` calls the composable and passes state down.
5. **Components**: draw props, emit events, `defineModel` for two-way state.
6. **Nav**: one entry in `app/utils/nav.ts` with the same `roles` as the page's `definePageMeta`.

## 2. Pick the fetch style

| Data | Pattern | Example |
| --- | --- | --- |
| Needed on first render (lists, dashboards) | `useFetch` in the composable, SSR | `useReportList.ts` |
| Follows the map / user input | `$fetch` + `AbortController` (+ debounce) | `useReports.ts`, `useNearby.ts` |
| Mutations | `$fetch` with `method`, update local state from the response | `useReportList.updateStatus` |

`useFetch` composable shape (order matters):

```ts
export async function useThing() {
    const state = ref<Thing[]>([]);
    const page = useFetch<ThingResponse>("/api/thing", { query: computed(() => ({ ... })) });
    const { data, pending, error } = page;
    watch(data, (d) => (state.value = d?.items ?? []));
    await page;
    state.value = data.value?.items ?? [];
    return { state, pending, error };
}
```

Page: `const { state } = await useThing();` inside `<script setup lang="ts">`.

## 3. Page shell

- Staff-only: `definePageMeta({ roles: ["moderator", "admin"] })`, matching `nav.ts`. The API guard is still required.
- Loading: `AppLoader`; empty: `AppEmptyState`; errors in a visible message, `aria-live` only for errors and state changes.
- Maps: reuse `useLeafletMap` and `.client.vue` components; follow the Leaflet rules in `AGENTS.md`.
- Status colours from `app/utils/report-status.ts`; icons `lucide:*`.

## 4. Traps to call out in a guide

- `useFetch` awaited too early: hooks after an `await` lose the component.
- State seeded only by a watcher: empty on the server, hydration mismatch.
- A watcher writing its own source: loop.
- A late response for an old request: abort or compare.
- Server helpers imported in client code: typechecks, crashes at runtime.
- `bigint` / `numeric` / `interval` serialisation from `pg`.

## 5. Verify

`make typecheck`, then the `verify-changes` skill: API checks with curl, then the page in a browser as `user` and as `moderator` (SSR HTML and after hydration). Update `docs/PROGRESS.md` when the slice is done.

Result: a working slice, a pass/fail table, and PROGRESS.md moved forward.
