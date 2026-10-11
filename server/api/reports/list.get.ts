import { z } from "zod";

const WHERE = `
	WHERE ($1::text IS NULL OR reported_by = $1)
		AND ($2::text IS NULL OR status = $2)
		AND ($3::text IS NULL
			OR description ILIKE '%' || $3 || '%'
			OR id = $4::bigint)
`;

const COUNT = `SELECT count(*)::int AS total FROM dump_reports ${WHERE}`;

const ORDER: Record<ReportSort, (dir: "ASC" | "DESC") => string> = {
    reported: (dir) => `reported_at ${dir}, id ${dir}`,
    cleared: (dir) => `cleared_at ${dir} NULLS LAST, id ${dir}`,
    status: (dir) =>
        `array_position(ARRAY['open', 'assigned', 'cleared'], status) ${dir}, reported_at DESC, id DESC`,
};

const rowsQuery = (sort: ReportSort, dir: SortDir) => `
	SELECT id, status, description, reported_at, cleared_at,
		ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
	FROM dump_reports
	${WHERE}
	ORDER BY ${ORDER[sort](dir === "asc" ? "ASC" : "DESC")}
	LIMIT $5 OFFSET $6
`;

const pageParam = z
    .string()
    .regex(/^\d{1,5}$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(REPORTS_MAX_PAGE));

const sizeParam = z
    .string()
    .regex(/^\d{1,3}$/)
    .transform(Number)
    .pipe(z.literal(REPORTS_PAGE_SIZES));

export default defineEventHandler(async (event): Promise<DumpReportList> => {
    const session = await requireSession(event);
    const canModerate = await hasPermission(session, { report: ["moderate"] });

    const query = await getValidatedQuery(
        event,
        z.object({
            status: z.enum(REPORT_STATUSES).optional(),
            q: z.string().trim().max(REPORT_SEARCH_MAX).optional(),
            page: pageParam.optional(),
            size: sizeParam.optional(),
            sort: z.enum(REPORT_SORTS).optional(),
            dir: z.enum(["asc", "desc"]).optional(),
        }).parse,
    );

    const size = query.size ?? REPORTS_PAGE_SIZE;
    const q = query.q || null;
    const id = q?.match(/^#?(\d{1,18})$/)?.[1] ?? null;
    const params = [
        canModerate ? null : session.user.id,
        query.status ?? null,
        q?.replace(/[\\%_]/g, "\\$&") ?? null,
        id,
    ];

    const counted = await db().query<{ total: number }>(COUNT, params);
    const total = counted.rows[0]?.total ?? 0;
    const page = Math.min(query.page ?? 1, Math.max(1, Math.ceil(total / size)));

    const { rows: reports } = total
        ? await db().query<DumpReport>(
			rowsQuery(query.sort ?? "reported", query.dir ?? "desc"),
			[...params, size, (page - 1) * size],
		)
        : { rows: [] };

    return { reports, total, page, canModerate };
});
