<script setup lang="ts">
const {
    center,
    radius,
    points,
    inServiceArea,
    loading,
    locating,
    error,
    search,
    locate,
} = useNearby();

const { show, bbox, reports, loadingReports, tooLarge, errorReports } =
    useReports();

const route = useRoute();
const focus = computed(() => {
    const decimal = (v: unknown) =>
        typeof v === "string" && /^-?\d{1,3}(\.\d+)?$/.test(v);
    if (!decimal(route.query.lat) || !decimal(route.query.lng)) return null;
    const lat = Number(route.query.lat);
    const lng = Number(route.query.lng);
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    const radius =
        HOTSPOT_RADII.find((r) => String(r) === route.query.radius) ??
        HOTSPOT_RADIUS;
    const type =
        (Object.keys(pointTypeColors) as CollectionPointType[]).find(
            (t) => t === route.query.type,
        ) ?? null;
    return { lat, lng, radius, type };
});

onMounted(() => {
    if (focus.value) show.value = true;
});
</script>

<template>
    <div class="absolute inset-0">
        <ClientOnly>
            <MapView
                :center="center"
                :radius="radius"
                :points="points"
                :reports="reports"
                :focus="focus"
                @pick="search"
                @bounds="bbox = $event"
            />
            <template #fallback>
                <AppLoader overlay size="lg" label="Loading map" :delay="0" />
            </template>
        </ClientOnly>

        <NearbyPanel
            v-model:radius="radius"
            :points="points"
            :in-service-area="inServiceArea"
            :loading="loading"
            :locating="locating"
            :error="error"
            :has-center="!!center"
            @locate="locate"
        />

        <ReportsLayerCard
            v-model:show="show"
            :count="reports.length"
            :loading-reports="loadingReports"
            :too-large="tooLarge"
            :error-reports="errorReports"
        />
    </div>
</template>
