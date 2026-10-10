<script setup lang="ts">
const { center, radius, points, inServiceArea, loading, locating, error, search, locate } = useNearby();
</script>

<template>
    <div class="absolute inset-0">
        <ClientOnly>
            <MapView :center="center" :radius="radius" :points="points" @pick="search" />
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
    </div>
</template>
