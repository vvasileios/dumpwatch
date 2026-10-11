import assert from "node:assert/strict";
import { test } from "node:test";
import type { Hotspot, NearbyResponse } from "../shared/types/collection-point.ts";
import type { ReportWithNearest } from "../shared/types/report.ts";
import { anonymous, CITY, db, SEA, userWithRole } from "./helpers.ts";

test("map reports: bbox required, size-limited, nearest point included", async () => {
    const citizen = await userWithRole("user");
    assert.equal((await anonymous.get("/api/reports?bbox=22.9,40.6,23.0,40.66")).status, 401);

    const ok = await citizen.get<ReportWithNearest[]>("/api/reports?bbox=22.9,40.6,23.0,40.66");
    assert.equal(ok.status, 200);
    assert.ok(ok.data.length > 0 && ok.data.every((r) => r.nearest));

    const big = await citizen.get("/api/reports?bbox=22.0,40.0,23.0,41.0");
    assert.equal(big.status, 400);
    assert.deepEqual(big.data.data.bbox, ["Area too large"]);
    assert.equal((await citizen.get("/api/reports?bbox=1,2,3")).status, 400);
});

test("nearby: sorted by distance inside the city, empty in the sea", async () => {
    const citizen = await userWithRole("user");
    const inside = await citizen.get<NearbyResponse>(
        `/api/points/nearby?lat=${CITY.lat}&lng=${CITY.lng}&radius=500`,
    );
    assert.equal(inside.data.inServiceArea, true);
    const meters = inside.data.points.map((p) => p.meters);
    assert.ok(meters.length > 0 && meters.every((m, i) => i === 0 || meters[i - 1]! <= m));
    assert.ok(meters.every((m) => m <= 500));

    const sea = await citizen.get<NearbyResponse>(`/api/points/nearby?lat=${SEA.lat}&lng=${SEA.lng}`);
    assert.deepEqual(sea.data, { inServiceArea: false, points: [] });
    assert.equal((await citizen.get("/api/points/nearby?lat=x&lng=1")).status, 400);
});

test("hotspots: staff only, radius whitelist, ranking matches brute force", async () => {
    const citizen = await userWithRole("user");
    const moderator = await userWithRole("moderator");
    assert.equal((await citizen.get("/api/points/hotspots")).status, 403);
    assert.equal((await moderator.get("/api/points/hotspots?radius=30")).status, 400);

    const res = await moderator.get<Hotspot[]>("/api/points/hotspots?radius=100");
    assert.equal(res.status, 200);
    const counts = res.data.map((h) => h.reports_nearby);
    assert.deepEqual(counts, [...counts].sort((a, b) => b - a));

    const top = res.data[0]!;
    const { rows } = await db.query(
        `SELECT count(*)::int AS n FROM dump_reports r, collection_points cp
		WHERE cp.id = $1 AND r.status IN ('open', 'assigned')
			AND ST_Distance(cp.location, r.location) <= 100`,
        [top.id],
    );
    assert.equal(top.reports_nearby, rows[0].n);
});
