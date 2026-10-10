import { z } from "zod";

const DECIMAL = /^-?\d+(\.\d+)?$/;

const numberParam = (schema: z.ZodNumber) =>
    z.string().trim().regex(DECIMAL, "Must be a decimal number").transform(Number).pipe(schema);

const Query = z.object({
    lat: numberParam(z.number().min(-90).max(90)),
    lng: numberParam(z.number().min(-180).max(180)),
    radius: numberParam(z.number().int().min(50).max(5000)).default(500),
});

const IN_SERVICE_AREA_SQL = `
SELECT EXISTS (
	SELECT 1 FROM zones
	WHERE ST_Covers(boundary, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)
) AS inside`;

const NEARBY_SQL = `
SELECT id, type, fill_level,
	ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng,
	ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS meters
FROM collection_points
WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
ORDER BY meters
LIMIT $4`;

export default defineEventHandler(async (event): Promise<NearbyResponse> => {
    await requireSession(event);
    const { lat, lng, radius } = await getValidatedQuery(event, Query.parse);

    const area = await db().query<{ inside: boolean }>(IN_SERVICE_AREA_SQL, [lng, lat]);
    if (!area.rows[0]?.inside) return { inServiceArea: false, points: [] };

    const { rows } = await db().query<NearbyPoint>(NEARBY_SQL, [lng, lat, radius, NEARBY_LIMIT]);
    return { inServiceArea: true, points: rows };
});
