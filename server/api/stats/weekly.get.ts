import { z } from "zod";

const START = `date_trunc('week', now() - ($1 - 1) * interval '1 week', $2)`;

const WEEKS = `
	generate_series(${START}, date_trunc('week', now(), $2), interval '1 week', $2) AS w(week)
`;

const ALL_QUERY = `
	WITH counts AS (
		SELECT date_trunc('week', reported_at, $2) AS week, count(*)::int AS reports
		FROM dump_reports
		WHERE reported_at >= ${START}
		GROUP BY 1
	)
	SELECT w.week, coalesce(c.reports, 0) AS reports
	FROM ${WEEKS}
	LEFT JOIN counts c USING (week)
	ORDER BY w.week
`;

const ZONE_QUERY = `
	WITH counts AS (
		SELECT date_trunc('week', r.reported_at, $2) AS week, count(*)::int AS reports
		FROM zones z
		JOIN dump_reports r ON ST_Covers(z.boundary, r.location)
		WHERE z.id = $3 AND r.reported_at >= ${START}
		GROUP BY 1
	)
	SELECT w.week, coalesce(c.reports, 0) AS reports
	FROM ${WEEKS}
	LEFT JOIN counts c USING (week)
	WHERE EXISTS (SELECT 1 FROM zones WHERE id = $3)
	ORDER BY w.week
`;

export default defineEventHandler(async (event): Promise<WeeklyCount[]> => {
    await requirePermission(event, { report: ["moderate"] });

    const { zone } = parseInput(
        z.object({ zone: z.string().regex(/^\d{1,18}$/).optional() }),
        getQuery(event),
    );

    const params = [TREND_WEEKS, CITY_TIMEZONE];
    const { rows } = zone
        ? await db().query<WeeklyCount>(ZONE_QUERY, [...params, zone])
        : await db().query<WeeklyCount>(ALL_QUERY, params);

    if (!rows.length)
        throw createError({ statusCode: 404, statusMessage: "Zone not found" });
    return rows;
});
