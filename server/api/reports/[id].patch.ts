import { z } from "zod";

const QUERY = `
	UPDATE dump_reports
	SET status = $2::text,
		cleared_at = CASE WHEN $2::text = 'cleared' THEN COALESCE(cleared_at, now()) END
	WHERE id = $1
	RETURNING id, status, description, reported_at, cleared_at,
		ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng`;

export default defineEventHandler(async (event): Promise<DumpReport> => {
    await requirePermission(event, { report: ["update"] });
    const { id } = parseInput(
        z.object({ id: z.string().regex(/^\d{1,18}$/) }),
        getRouterParams(event),
    );

    const { status } = parseInput(
        z.object({
            status: z.enum(REPORT_STATUSES),
        }),
        await readBody(event),
    );

    const { rows } = await db().query<DumpReport>(QUERY, [id, status]);

    if (rows.length === 0) {
        throw createError({
            statusCode: 404,
            statusMessage: "Report not found",
        });
    }

    return rows[0]!;
});
