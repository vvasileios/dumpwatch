export async function useHotspots() {
    const route = useRoute();
    const router = useRouter();

    const radius = computed({
        get: () =>
            HOTSPOT_RADII.find((r) => String(r) === route.query.radius) ??
            HOTSPOT_RADIUS,
        set: (value: number) =>
            router.push({
                query: value === HOTSPOT_RADIUS ? {} : { radius: String(value) },
            }),
    });

    const list = useFetch<Hotspot[]>("/api/points/hotspots", {
        query: computed(() =>
            radius.value === HOTSPOT_RADIUS ? {} : { radius: radius.value },
        ),
        default: () => [],
    });

    await list;

    return {
        hotspots: list.data,
        pending: list.pending,
        error: list.error,
        refresh: list.refresh,
        radius,
    };
}
