<script setup lang="ts">
definePageMeta({ roles: ["moderator", "admin"] });

const { hotspots, pending, error, refresh, radius } = await useHotspots();

const radiusOptions = HOTSPOT_RADII.map((r) => ({
    value: r as number,
    label: `Dumps within ${r} m`,
}));

const columns = [
    { key: "point", label: "Collection point" },
    { key: "reports_nearby", label: "Dumps nearby", class: "font-medium text-zinc-900 tabular-nums dark:text-white" },
    { key: "oldest", label: "Oldest dump", class: "whitespace-nowrap text-zinc-500 dark:text-zinc-400" },
    { key: "map", label: "Map" },
];

function age(days: number) {
    if (days === 0) return "today";
    return days === 1 ? "1 day" : `${days} days`;
}
</script>

<template>
    <div class="mx-auto max-w-5xl p-5 sm:p-6">
        <div class="flex flex-wrap items-end gap-3">
            <div class="mr-auto">
                <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">
                    Hotspots
                </h2>
                <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Collection points with open or assigned dumps nearby, most
                    dumps first, then fullest.
                </p>
            </div>
            <SharedSelect
                v-model="radius"
                :options="radiusOptions"
                aria-label="Search radius"
            />
        </div>

        <div
            v-if="error"
            role="alert"
            class="mt-6 flex flex-wrap items-center gap-3 text-sm text-red-600 dark:text-red-400"
        >
            Couldn't load hotspots.
            <SharedButton variant="secondary" @click="refresh()">
                Retry
            </SharedButton>
        </div>

        <AppEmptyState
            v-else-if="!hotspots.length"
            icon="lucide:circle-check"
            title="No hotspots"
            :description="`No open dumps within ${radius} m of a collection point.`"
        />

        <SharedTable
            v-else
            label="Collection point hotspots"
            :rows="hotspots"
            :columns="columns"
            class="mt-5"
            :class="pending && 'opacity-60'"
            :aria-busy="pending"
        >
            <template #cell-point="{ row }">
                <PointsBadge :type="row.type" :fill-level="row.fill_level" />
            </template>
            <template #cell-oldest="{ row }">
                {{ age(row.oldest_days) }}
            </template>
            <template #cell-map="{ row }">
                <NuxtLink
                    :to="{
                        path: '/',
                        query: { lat: row.lat, lng: row.lng, radius, type: row.type },
                    }"
                    class="inline-flex items-center gap-1 rounded-md text-emerald-700 hover:underline focus-visible:ring-4 focus-visible:ring-emerald-600/25 focus-visible:outline-none dark:text-emerald-400"
                    :aria-label="`Show ${row.type} point #${row.id} on the map`"
                >
                    <Icon name="lucide:map-pin" class="size-4" />
                    Show
                </NuxtLink>
            </template>
        </SharedTable>
    </div>
</template>
