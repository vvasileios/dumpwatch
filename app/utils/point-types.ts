export const pointTypeColors: Record<CollectionPointType, string> = {
    mixed: "#71717a",
    recycling: "#2563eb",
    glass: "#059669",
    organic: "#d97706",
};

export function formatDistance(meters: number) {
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}
