import assert from "node:assert/strict";
import { test } from "node:test";
import type { WeeklyCount, ZoneDashboard } from "../shared/types/stats.ts";
import { db, userWithRole } from "./helpers.ts";

test("stats are staff only", async () => {
    const citizen = await userWithRole("user");
    assert.equal((await citizen.get("/api/stats/zones")).status, 403);
    assert.equal((await citizen.get("/api/stats/weekly")).status, 403);
});

test("zone stats: numbers, city row from all reports", async () => {
    const moderator = await userWithRole("moderator");
    const res = await moderator.get<ZoneDashboard>("/api/stats/zones");
    assert.equal(res.data.zones.length, 3);
    const { rows } = await db.query(
        "SELECT count(*) FILTER (WHERE status = 'open')::int AS open FROM dump_reports",
    );
    assert.equal(res.data.city.open, rows[0].open);
    assert.equal(typeof res.data.city.avg_hours_to_clear, "number");
    const zoneOpen = res.data.zones.reduce((sum, z) => sum + z.open, 0);
    assert.ok(zoneOpen >= res.data.city.open);
});

test("weekly trend: 12 Monday-00:00 Athens weeks, empty weeks filled", async () => {
    const moderator = await userWithRole("moderator");
    const res = await moderator.get<WeeklyCount[]>("/api/stats/weekly");
    assert.equal(res.data.length, 12);
    const fmt = new Intl.DateTimeFormat("en", {
        weekday: "short",
        hour: "numeric",
        hourCycle: "h23",
        timeZone: "Europe/Athens",
    });
    assert.ok(res.data.every((w) => fmt.format(new Date(w.week)).replace(",", "") === "Mon 00"));
    assert.ok(res.data.some((w) => w.reports === 0));
});

test("weekly trend per zone: 404 unknown, 400 bad id", async () => {
    const moderator = await userWithRole("moderator");
    const zone = await moderator.get<WeeklyCount[]>("/api/stats/weekly?zone=1");
    assert.equal(zone.data.length, 12);
    assert.equal((await moderator.get("/api/stats/weekly?zone=999")).status, 404);
    assert.equal((await moderator.get("/api/stats/weekly?zone=abc")).status, 400);
});
