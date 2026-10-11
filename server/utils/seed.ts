import type { H3Event } from "h3";
import type { PoolClient } from "pg";

const DEMO_USERS = [
    { email: "citizen@dumpwatch.local", name: "Demo citizen", role: "user" },
    { email: "moderator@dumpwatch.local", name: "Demo moderator", role: "moderator" },
] as const;
const DEMO_EMAILS = DEMO_USERS.map((u) => u.email);
const DEMO_PASSWORD = "demo-password";

const SEED_FILES = { zones: "zones.sql", points: "points.sql", reports: "reports.sql" };

const REMOVE = {
    zones: "DELETE FROM zones WHERE is_sample",
    points: "DELETE FROM collection_points WHERE is_sample",
    reports: "DELETE FROM dump_reports WHERE is_sample",
};

const COUNTS = `
	SELECT
		(SELECT count(*) FILTER (WHERE is_sample) FROM zones)::int AS zones_sample,
		(SELECT count(*) FILTER (WHERE NOT is_sample) FROM zones)::int AS zones_yours,
		(SELECT count(*) FILTER (WHERE is_sample) FROM collection_points)::int AS points_sample,
		(SELECT count(*) FILTER (WHERE NOT is_sample) FROM collection_points)::int AS points_yours,
		(SELECT count(*) FILTER (WHERE is_sample) FROM dump_reports)::int AS reports_sample,
		(SELECT count(*) FILTER (WHERE NOT is_sample) FROM dump_reports)::int AS reports_yours,
		(SELECT count(*) FROM "user" WHERE email = ANY($1))::int AS users_sample,
		(
			(SELECT count(*) FROM collection_points p WHERE NOT p.is_sample
				AND EXISTS (SELECT 1 FROM zones z WHERE z.is_sample AND ST_Covers(z.boundary, p.location)))
			+ (SELECT count(*) FROM dump_reports r WHERE NOT r.is_sample
				AND EXISTS (SELECT 1 FROM zones z WHERE z.is_sample AND ST_Covers(z.boundary, r.location)))
		)::int AS yours_in_sample_zones
`;

const SAMPLE_DEPENDENTS = `
	SELECT EXISTS (SELECT 1 FROM collection_points WHERE is_sample)
		OR EXISTS (SELECT 1 FROM dump_reports WHERE is_sample) AS blocked
`;

type Counts = {
    zones_sample: number;
    zones_yours: number;
    points_sample: number;
    points_yours: number;
    reports_sample: number;
    reports_yours: number;
    users_sample: number;
    yours_in_sample_zones: number;
};

export async function requireDemoTools(event: H3Event) {
    if (!useRuntimeConfig(event).public.demoTools)
        throw createError({ statusCode: 404, statusMessage: "Not found" });
    return requirePermission(event, { demo: ["manage"] });
}

export async function seedOverview(): Promise<SeedOverview> {
    const { rows } = await db().query<Counts>(COUNTS, [DEMO_EMAILS]);
    const c = rows[0]!;
    const needsZones =
        c.zones_sample + c.zones_yours === 0 ? "Needs zones. Seed zones first." : null;
    const zonesBlocked = c.points_sample > 0 || c.reports_sample > 0;

    return {
        entities: [
            {
                entity: "zones",
                sample: c.zones_sample,
                yours: c.zones_yours,
                canSeed: c.zones_sample === 0,
                canRemove: c.zones_sample > 0 && !zonesBlocked,
                reason:
                    c.zones_sample > 0 && zonesBlocked
                        ? "Remove the sample collection points and reports first."
                        : null,
                warning: c.yours_in_sample_zones
                    ? `${c.yours_in_sample_zones} of your points and reports are inside these zones and will end up outside the service area.`
                    : null,
            },
            {
                entity: "points",
                sample: c.points_sample,
                yours: c.points_yours,
                canSeed: c.points_sample === 0 && !needsZones,
                canRemove: c.points_sample > 0,
                reason: c.points_sample === 0 ? needsZones : null,
                warning: null,
            },
            {
                entity: "reports",
                sample: c.reports_sample,
                yours: c.reports_yours,
                canSeed: c.reports_sample === 0 && !needsZones,
                canRemove: c.reports_sample > 0,
                reason: c.reports_sample === 0 ? needsZones : null,
                warning: null,
            },
            {
                entity: "users",
                sample: c.users_sample,
                yours: null,
                canSeed: c.users_sample < DEMO_USERS.length,
                canRemove: c.users_sample > 0,
                reason: null,
                warning: null,
            },
        ],
        demoUsers: DEMO_USERS.map(({ email, role }) => ({ email, role })),
        demoPassword: DEMO_PASSWORD,
    };
}

async function withSeedLock(work: (client: PoolClient) => Promise<void>) {
    const client = await db().connect();
    try {
        await client.query("BEGIN");
        await client.query("SELECT pg_advisory_xact_lock(hashtext('dumpwatch:seed'))");
        await work(client);
        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        const e = err as { code?: string; message?: string };
        if (e.code === "P0001")
            throw createError({ statusCode: 409, statusMessage: "Conflict", message: e.message });
        throw err;
    } finally {
        client.release();
    }
}

export async function seedEntity(entity: SeedEntity) {
    await withSeedLock(async (client) => {
        if (entity === "users") {
            const { rows } = await client.query<{ email: string }>(
                'SELECT email FROM "user" WHERE email = ANY($1)',
                [DEMO_EMAILS],
            );
            for (const user of DEMO_USERS) {
                if (rows.some((r) => r.email === user.email)) continue;
                await auth.api.createUser({
                    body: { ...user, password: DEMO_PASSWORD },
                });
            }
            return;
        }
        const sql = await useStorage("assets:seed").getItem<string>(SEED_FILES[entity]);
        if (!sql) throw new Error(`Seed file missing: ${SEED_FILES[entity]}`);
        await client.query(sql);
    });
}

export async function removeEntity(entity: SeedEntity) {
    await withSeedLock(async (client) => {
        if (entity === "users") {
            await client.query('DELETE FROM "user" WHERE email = ANY($1)', [DEMO_EMAILS]);
            return;
        }
        if (entity === "zones") {
            const { rows } = await client.query<{ blocked: boolean }>(SAMPLE_DEPENDENTS);
            if (rows[0]!.blocked)
                throw createError({
                    statusCode: 409,
                    statusMessage: "Conflict",
                    message: "Remove the sample collection points and reports first.",
                });
        }
        await client.query(REMOVE[entity]);
    });
}
