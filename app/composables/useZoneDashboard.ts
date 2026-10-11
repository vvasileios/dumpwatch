export async function useZoneDashboard() {
    const route = useRoute();
    const router = useRouter();

    const zoneId = computed(() => {
        const z = route.query.zone;
        return typeof z === "string" && /^[1-9]\d{0,17}$/.test(z) ? z : null;
    });

    const stats = useFetch<ZoneDashboard>("/api/stats/zones");
    const trend = useFetch<WeeklyCount[]>("/api/stats/weekly", {
        query: computed(() => (zoneId.value ? { zone: zoneId.value } : {})),
        default: () => [],
    });

    const selected = computed(
        () => stats.data.value?.zones.find((z) => z.id === zoneId.value) ?? null,
    );

    function select(id: string | null) {
        router.push({ query: id ? { zone: id } : {} });
    }

    await Promise.all([stats, trend]);

    return {
        dashboard: stats.data,
        statsError: stats.error,
        refreshStats: stats.refresh,
        weeks: trend.data,
        trendPending: trend.pending,
        trendError: trend.error,
        refreshTrend: trend.refresh,
        zoneId,
        selected,
        select,
    };
}
