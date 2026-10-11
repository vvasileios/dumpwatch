export function formatHours(hours: number | null) {
    if (hours === null) return "—";
    return hours < 48
        ? `${Math.round(hours)} h`
        : `${(hours / 24).toFixed(1)} days`;
}
