export const NEAREST_POINT_JOIN = `
	LEFT JOIN LATERAL (
		SELECT json_build_object(
			'id', cp.id::text,
			'type', cp.type,
			'fill_level', cp.fill_level,
			'meters', round(ST_Distance(cp.location, p.location))::int
		) AS nearest
		FROM collection_points cp
		ORDER BY cp.location <-> p.location
		LIMIT 1
	) n ON true
`;
