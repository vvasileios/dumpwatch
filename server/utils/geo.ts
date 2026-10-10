const QUERY = `SELECT EXISTS (
	SELECT 1 FROM zones
	WHERE ST_Covers(boundary, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)
) AS inside`;

export async function isInServiceArea(
    lng: number,
    lat: number,
): Promise<boolean> {
    const area = await db().query<{ inside: boolean }>(QUERY, [lng, lat]);
    return !!area.rows[0]?.inside;
}
