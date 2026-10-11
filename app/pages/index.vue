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
</script>

<template>
    <div class="absolute inset-0">
        <ClientOnly>
            <MapView
                :center="center"
                :radius="radius"
                :points="points"
                :reports="reports"
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
