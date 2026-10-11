import { z } from "zod";

const QUERY = `
	SELECT cp.id, cp.type, cp.fill_level,
		ST_Y(cp.location::geometry) AS lat, ST_X(cp.location::geometry) AS lng,
		count(*)::int AS reports_nearby,
		floor(extract(epoch FROM now() - min(r.reported_at)) / 86400)::int AS oldest_days
	FROM dump_reports r
	JOIN collection_points cp ON ST_DWithin(cp.location, r.location, $1)
	WHERE r.status IN ('open', 'assigned')
	GROUP BY cp.id
	ORDER BY reports_nearby DESC, cp.fill_level DESC NULLS LAST, cp.id
	LIMIT $2
`;

export default defineEventHandler(async (event): Promise<Hotspot[]> => {
    await requirePermission(event, { report: ["moderate"] });

    const { radius } = parseInput(
        z.object({
            radius: z
                .string()
                .regex(/^\d{1,3}$/)
                .transform(Number)
                .pipe(z.literal(HOTSPOT_RADII))
                .default(HOTSPOT_RADIUS),
        }),
        getQuery(event),
    );

    const { rows } = await db().query<Hotspot>(QUERY, [radius, HOTSPOTS_LIMIT]);
    return rows;
});
