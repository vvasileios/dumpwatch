export function useNearby() {
    const center = ref<{ lat: number; lng: number } | null>(null);
    const radius = ref(500);
    const points = ref<NearbyPoint[]>([]);
    const inServiceArea = ref(true);
    const loading = ref(false);
    const locating = ref(false);
    const error = ref<string | null>(null);
    let controller: AbortController | undefined;
    let latestRequest = 0;

    function reset(message: string | null) {
        controller?.abort();
        center.value = null;
        points.value = [];
        inServiceArea.value = true;
        loading.value = false;
        error.value = message;
    }

    async function search(lat: number, lng: number) {
        latestRequest++;
        controller?.abort();
        const current = new AbortController();
        controller = current;

        center.value = { lat, lng };
        points.value = [];
        inServiceArea.value = true;
        loading.value = true;
        error.value = null;

        try {
            const result = await $fetch<NearbyResponse>("/api/points/nearby", {
                query: { lat, lng, radius: radius.value },
                signal: current.signal,
            });
            points.value = result.points;
            inServiceArea.value = result.inServiceArea;
        } catch (err) {
            if (current.signal.aborted) return;
            console.error(err);
            error.value = "Couldn't load collection points. Try again.";
        } finally {
            if (controller === current) loading.value = false;
        }
    }

    function locate() {
        if (!navigator.geolocation) {
            reset("Location isn't available in this browser.");
            return;
        }
        if (locating.value) return;

        const requestedAt = ++latestRequest;
        locating.value = true;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                locating.value = false;
                if (requestedAt !== latestRequest) return;
                search(pos.coords.latitude, pos.coords.longitude);
            },
            () => {
                locating.value = false;
                if (requestedAt !== latestRequest) return;
                reset("Couldn't get your location.");
            },
            { enableHighAccuracy: true, timeout: 10_000 },
        );
    }

    watch(radius, () => {
        if (center.value) search(center.value.lat, center.value.lng);
    });

    onBeforeUnmount(() => controller?.abort());

    return { center, radius, points, inServiceArea, loading, locating, error, search, locate };
}
