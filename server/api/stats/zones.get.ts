const COUNTS = `
	count(r.id) FILTER (WHERE r.status = 'open')::int     AS open,
	count(r.id) FILTER (WHERE r.status = 'assigned')::int AS assigned,
	count(r.id) FILTER (WHERE r.status = 'cleared')::int  AS cleared,
	round(extract(epoch FROM avg(r.cleared_at - r.reported_at)) / 3600, 1)::float8 AS avg_hours_to_clear
`;

const QUERY = `
	SELECT z.id, z.name, ${COUNTS}
	FROM zones z
	LEFT JOIN dump_reports r ON ST_Covers(z.boundary, r.location)
	GROUP BY z.id, z.name
	UNION ALL
	SELECT NULL, NULL, ${COUNTS}
	FROM dump_reports r
	ORDER BY open DESC, name
`;

type Row = ZoneCounts & { id: string | null; name: string | null };

export default defineEventHandler(async (event): Promise<ZoneDashboard> => {
    await requirePermission(event, { report: ["moderate"] });

    const { rows } = await db().query<Row>(QUERY);
    const { id: _id, name: _name, ...city } = rows.find((r) => r.id === null)!;

    return {
        city,
        zones: rows.filter((r): r is ZoneStats => r.id !== null),
    };
});
