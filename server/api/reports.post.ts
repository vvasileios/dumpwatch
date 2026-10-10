import { z } from "zod";

const BODY = z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    description: z.string().trim().min(5).max(1000),
});

export default defineEventHandler(async (event): Promise<Report> => {
    const session = await requirePermission(event, { report: ["create"] });
    const { lat, lng, description } = await readValidatedBody(
        event,
        BODY.parse,
    );

    const inServiceArea = await isInServiceArea(lng, lat);
    if (!inServiceArea) {
        throw createError({
            statusCode: 422,
            statusMessage: "Location is not in service area",
        });
    }

    const { rows } = await db().query<Report>(
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
