import assert from "node:assert/strict";
import { test } from "node:test";
import type { DumpReportList, ReportWithNearest } from "../shared/types/report.ts";
import { anonymous, CITY, db, userWithRole } from "./helpers.ts";

const order = ["open", "assigned", "cleared"];

test("list needs a session", async () => {
    assert.equal((await anonymous.get("/api/reports/list")).status, 401);
});

test("citizens see only their own reports", async () => {
    const citizen = await userWithRole("user");
    await citizen.post("/api/reports", { ...CITY, description: "Mine only" });
    const res = await citizen.get<DumpReportList>("/api/reports/list");
    assert.equal(res.data.total, 1);
    assert.equal(res.data.canModerate, false);
    assert.equal(res.data.reports[0]!.description, "Mine only");
});

test("moderators page through everything; total matches the table", async () => {
    const moderator = await userWithRole("moderator");
    const { rows } = await db.query("SELECT count(*)::int AS n FROM dump_reports");
    const p1 = await moderator.get<DumpReportList>("/api/reports/list?size=10");
    const p2 = await moderator.get<DumpReportList>("/api/reports/list?size=10&page=2");
    assert.equal(p1.data.total, rows[0].n);
    assert.equal(p1.data.reports.length, 10);
    const ids = new Set([...p1.data.reports, ...p2.data.reports].map((r) => r.id));
    assert.equal(ids.size, 20);
});

test("a page past the end is clamped to the last page", async () => {
    const moderator = await userWithRole("moderator");
    const res = await moderator.get<DumpReportList>("/api/reports/list?size=50&page=999");
    assert.equal(res.data.page, Math.ceil(res.data.total / 50));
    assert.ok(res.data.reports.length > 0);
});

test("search treats % and _ literally and matches #id", async () => {
    const citizen = await userWithRole("user");
    const literal = await citizen.post("/api/reports", { ...CITY, description: "Bin 100% full" });
    await citizen.post("/api/reports", { ...CITY, description: "Bin 100 full" });
    const percent = await citizen.get<DumpReportList>("/api/reports/list?q=100%25");
    assert.deepEqual(percent.data.reports.map((r) => r.id), [literal.data.id]);
    const underscore = await citizen.get<DumpReportList>("/api/reports/list?q=_");
    assert.equal(underscore.data.total, 0);
    const byId = await citizen.get<DumpReportList>(`/api/reports/list?q=%23${literal.data.id}`);
    assert.deepEqual(byId.data.reports.map((r) => r.id), [literal.data.id]);
});

test("sorting by status follows the workflow order, both ways", async () => {
    const moderator = await userWithRole("moderator");
    for (const dir of ["asc", "desc"]) {
        const res = await moderator.get<DumpReportList>(`/api/reports/list?sort=status&dir=${dir}&size=50`);
        const ranks = res.data.reports.map((r) => order.indexOf(r.status));
        const sorted = [...ranks].sort((a, b) => (dir === "asc" ? a - b : b - a));
        assert.deepEqual(ranks, sorted);
    }
});

test("sorting by cleared date puts uncleared reports last", async () => {
    const moderator = await userWithRole("moderator");
    const res = await moderator.get<DumpReportList>("/api/reports/list?sort=cleared&dir=desc&size=50");
    const dates = res.data.reports.map((r) => r.cleared_at);
    const firstNull = dates.indexOf(null);
    assert.ok(firstNull === -1 || dates.slice(firstNull).every((d) => d === null));
});

test("every row has its nearest collection point, matching a brute-force query", async () => {
    const moderator = await userWithRole("moderator");
    const res = await moderator.get<DumpReportList>("/api/reports/list?size=10");
    const first = res.data.reports[0] as ReportWithNearest;
    assert.ok(res.data.reports.every((r) => r.nearest));
    const { rows } = await db.query(
        `SELECT cp.id, round(ST_Distance(cp.location, r.location))::int AS meters
		FROM dump_reports r, collection_points cp
		WHERE r.id = $1 ORDER BY ST_Distance(cp.location, r.location) LIMIT 1`,
        [first.id],
    );
    assert.equal(first.nearest!.id, rows[0].id);
    assert.equal(first.nearest!.meters, rows[0].meters);
});

test("bad list parameters are 400s with fieldErrors", async () => {
    const moderator = await userWithRole("moderator");
    const res = await moderator.get("/api/reports/list?size=7&dir=up&sort=id&page=0");
    assert.equal(res.status, 400);
    assert.deepEqual(Object.keys(res.data.data).sort(), ["dir", "page", "size", "sort"]);
});
