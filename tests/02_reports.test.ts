import assert from "node:assert/strict";
import { test } from "node:test";
import type { DumpReport } from "../shared/types/report.ts";
import { anonymous, CITY, SEA, userWithRole } from "./helpers.ts";

test("creating a report needs a session", async () => {
    const res = await anonymous.post("/api/reports", { ...CITY, description: "Old fridge" });
    assert.equal(res.status, 401);
});

test("create: 201 with string id, coordinates and open status", async () => {
    const citizen = await userWithRole("user");
    const res = await citizen.post<DumpReport>("/api/reports", {
        ...CITY,
        description: "  Broken chairs  ",
    });
    assert.equal(res.status, 201);
    assert.equal(typeof res.data.id, "string");
    assert.equal(res.data.status, "open");
    assert.equal(res.data.description, "Broken chairs");
    assert.ok(Math.abs(res.data.lat - CITY.lat) < 1e-9 && Math.abs(res.data.lng - CITY.lng) < 1e-9);
});

test("create: 400 with fieldErrors for each bad field", async () => {
    const citizen = await userWithRole("user");
    const res = await citizen.post("/api/reports", { lat: 200, lng: "x", description: "abc" });
    assert.equal(res.status, 400);
    assert.deepEqual(Object.keys(res.data.data).sort(), ["description", "lat", "lng"]);
});

test("create: 422 in the sea, outside the service area", async () => {
    const citizen = await userWithRole("user");
    const res = await citizen.post("/api/reports", { ...SEA, description: "Floating junk" });
    assert.equal(res.status, 422);
});

test("status: citizens can't change it, moderators can; cleared_at follows the status", async () => {
    const citizen = await userWithRole("user");
    const moderator = await userWithRole("moderator");
    const created = await citizen.post<DumpReport>("/api/reports", { ...CITY, description: "Tyres" });
    const url = `/api/reports/${created.data.id}`;

    assert.equal((await citizen.patch(url, { status: "cleared" })).status, 403);

    const cleared = await moderator.patch<DumpReport>(url, { status: "cleared" });
    assert.equal(cleared.status, 200);
    assert.ok(cleared.data.cleared_at);

    const reopened = await moderator.patch<DumpReport>(url, { status: "open" });
    assert.equal(reopened.data.cleared_at, null);
});

test("status: 400 for a bad status or id, 404 for a missing report", async () => {
    const moderator = await userWithRole("moderator");
    assert.equal((await moderator.patch("/api/reports/1", { status: "done" })).status, 400);
    assert.equal((await moderator.patch("/api/reports/abc", { status: "open" })).status, 400);
    assert.equal(
        (await moderator.patch("/api/reports/1234567890123456789", { status: "open" })).status,
        400,
    );
    assert.equal((await moderator.patch("/api/reports/999999999", { status: "open" })).status, 404);
});
