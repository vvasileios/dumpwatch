import assert from "node:assert/strict";
import { test } from "node:test";
import type { SeedOverview, SeedStatus } from "../shared/types/seed.ts";
import { admin, anonymous, Client, CITY, userWithRole } from "./helpers.ts";

const byEntity = (o: SeedOverview) =>
    Object.fromEntries(o.entities.map((e) => [e.entity, e])) as Record<string, SeedStatus>;

test("seed endpoints need an admin", async () => {
    assert.equal((await anonymous.get("/api/admin/seed")).status, 401);
    const citizen = await userWithRole("user");
    assert.equal((await citizen.get("/api/admin/seed")).status, 403);
    const moderator = await userWithRole("moderator");
    assert.equal((await moderator.post("/api/admin/seed/zones")).status, 403);
});

test("empty database: only zones and users can be seeded", async () => {
    const a = await admin();
    const res = await a.get<SeedOverview>("/api/admin/seed");
    assert.equal(res.status, 200);
    const s = byEntity(res.data);
    assert.deepEqual([s.zones!.sample, s.points!.sample, s.reports!.sample], [0, 0, 0]);
    assert.equal(s.zones!.canSeed, true);
    assert.equal(s.points!.canSeed, false);
    assert.match(s.points!.reason ?? "", /Needs zones/);
});

test("points and reports need zones (409 from the SQL guard)", async () => {
    const a = await admin();
    const res = await a.post("/api/admin/seed/points");
    assert.equal(res.status, 409);
    assert.match(res.data.message, /need zones/);
});

test("unknown entity is a 400 with fieldErrors", async () => {
    const a = await admin();
    const res = await a.post("/api/admin/seed/planets");
    assert.equal(res.status, 400);
    assert.ok(Array.isArray(res.data.data.entity));
});

test("seeding in dependency order, each only once", async () => {
    const a = await admin();
    const zones = await a.post<SeedOverview>("/api/admin/seed/zones");
    assert.equal(byEntity(zones.data).zones!.sample, 3);
    assert.equal((await a.post("/api/admin/seed/zones")).status, 409);

    const points = await a.post<SeedOverview>("/api/admin/seed/points");
    assert.equal(byEntity(points.data).points!.sample, 50000);

    const reports = await a.post<SeedOverview>("/api/admin/seed/reports");
    const s = byEntity(reports.data);
    assert.equal(s.reports!.sample, 500);
    assert.equal(s.zones!.canRemove, false);
    assert.match(s.zones!.reason ?? "", /Remove the sample/);
});

test("zones can't be removed while sample points or reports exist", async () => {
    const a = await admin();
    const res = await a.delete("/api/admin/seed/zones");
    assert.equal(res.status, 409);
});

test("remove deletes only sample rows; your data stays", async () => {
    const a = await admin();
    const citizen = await userWithRole("user");
    const own = await citizen.post("/api/reports", { ...CITY, description: "My own report" });
    assert.equal(own.status, 201);

    const removed = await a.delete<SeedOverview>("/api/admin/seed/reports");
    const s = byEntity(removed.data);
    assert.equal(s.reports!.sample, 0);
    assert.equal(s.reports!.yours, 1);
    assert.match(s.zones!.warning ?? "", /1 of your points and reports/);
});

test("two parallel seed requests: one wins, one gets 409 (advisory lock)", async () => {
    const a = await admin();
    const statuses = (
        await Promise.all([a.post("/api/admin/seed/reports"), a.post("/api/admin/seed/reports")])
    )
        .map((r) => r.status)
        .sort();
    assert.deepEqual(statuses, [200, 409]);
});

test("demo users can be seeded and can sign in", async () => {
    const a = await admin();
    const res = await a.post<SeedOverview>("/api/admin/seed/users");
    assert.equal(byEntity(res.data).users!.sample, 2);
    const demo = new Client();
    const signIn = await demo.post("/api/auth/sign-in/email", {
        email: res.data.demoUsers.find((u) => u.role === "moderator")!.email,
        password: res.data.demoPassword,
    });
    assert.equal(signIn.status, 200);
    assert.equal((await demo.get("/api/stats/zones")).status, 200);
});
