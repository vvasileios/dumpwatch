import { z } from "zod";

const QUERY = `
	SELECT id, status, description, reported_at, cleared_at,
		ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
	FROM dump_reports
	WHERE ($1::text IS NULL OR reported_by = $1)
		AND ($2::text IS NULL OR status = $2)
		AND ($3::bigint IS NULL OR (reported_at, id) <
			(SELECT reported_at, id FROM dump_reports
				WHERE id = $3 AND ($1::text IS NULL OR reported_by = $1)))
	ORDER BY reported_at DESC, id DESC
	LIMIT $4
`;

export default defineEventHandler(async (event): Promise<DumpReportList> => {
    const session = await requireSession(event);
    const canModerate = await hasPermission(session, { report: ["moderate"] });

    const { status, cursor } = await getValidatedQuery(
        event,
        z.object({
            status: z.enum(REPORT_STATUSES).optional(),
            cursor: z.string().regex(/^\d{1,18}$/).optional(),
        }).parse,
    );

    const { rows } = await db().query<DumpReport>(QUERY, [
        canModerate ? null : session.user.id,
        status ?? null,
        cursor ?? null,
        REPORTS_PAGE_SIZE + 1,
    ]);

    const isNextPage = rows.length > REPORTS_PAGE_SIZE;
    const reports = isNextPage ? rows.slice(0, REPORTS_PAGE_SIZE) : rows;
    const nextCursor = isNextPage ? reports.at(-1)!.id : null;

    return { reports, nextCursor, canModerate };
});
