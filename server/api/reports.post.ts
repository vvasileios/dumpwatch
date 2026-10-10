import { z } from "zod";

const BODY = z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    description: z
        .string()
        .trim()
        .min(REPORT_DESCRIPTION.min)
        .max(REPORT_DESCRIPTION.max),
});

export default defineEventHandler(async (event): Promise<DumpReport> => {
    const session = await requirePermission(event, { report: ["create"] });
    const result = BODY.safeParse(await readBody(event));
    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid report",
            data: z.flattenError(result.error).fieldErrors,
        });
    }
    const { lat, lng, description } = result.data;

    const inServiceArea = await isInServiceArea(lng, lat);
    if (!inServiceArea) {
        throw createError({
            statusCode: 422,
            statusMessage: "Location is not in service area",
        });
    }

    const { rows } = await db().query<DumpReport>(
        `
			INSERT INTO dump_reports (location, description, reported_by)
			VALUES (ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3, $4)
			RETURNING id, status, description, reported_at, cleared_at, ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
		`,
        [lng, lat, description, session.user.id],
    );

    setResponseStatus(event, 201);

    return rows[0]!;
});
