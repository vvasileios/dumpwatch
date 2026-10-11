import { z } from "zod";

const lngSchema = z.number().min(-180).max(180);
const latSchema = z.number().min(-90).max(90);

const BboxSchema = z
    .string()
    .transform((s) => s.split(",").map(Number))
    .pipe(z.tuple([lngSchema, latSchema, lngSchema, latSchema]))
    .refine(([x1, y1, x2, y2]) => x1 < x2 && y1 < y2, "min must be below max")
    .refine(
        ([x1, y1, x2, y2]) =>
            x2 - x1 <= REPORTS_MAX_SPAN && y2 - y1 <= REPORTS_MAX_SPAN,
        "Area too large",
    );

const QUERY = `
	SELECT p.id, p.status, p.description, p.reported_at, p.cleared_at,
		ST_Y(p.location::geometry) AS lat, ST_X(p.location::geometry) AS lng,
		n.nearest
	FROM (
		SELECT id, status, description, reported_at, cleared_at, location
		FROM dump_reports
		WHERE location && ST_MakeEnvelope($1, $2, $3, $4, 4326)::geography
		AND ($5::text IS NULL OR status = $5)
		ORDER BY reported_at DESC
		LIMIT $6
	) p
	${NEAREST_POINT_JOIN}
	ORDER BY p.reported_at DESC
`;
export default defineEventHandler(async (event): Promise<ReportWithNearest[]> => {
    await requireSession(event);

    const { bbox, status } = parseInput(
        z.object({
            bbox: BboxSchema,
            status: z.enum(REPORT_STATUSES).optional(),
        }),
        getQuery(event),
    );

    const [minLng, minLat, maxLng, maxLat] = bbox;
    const { rows } = await db().query<ReportWithNearest>(QUERY, [
        minLng,
        minLat,
        maxLng,
        maxLat,
        status ?? null,
        REPORTS_LIMIT,
    ]);

    return rows;
});
