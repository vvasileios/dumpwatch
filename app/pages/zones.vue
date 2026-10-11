<script setup lang="ts">
definePageMeta({ roles: ["moderator", "admin"] });

const {
    dashboard,
    statsError,
    refreshStats,
    weeks,
    trendPending,
    trendError,
    refreshTrend,
    zoneId,
    selected,
    select,
} = await useZoneDashboard();
</script>

<template>
    <div class="mx-auto max-w-5xl p-5 sm:p-6">
        <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">
            Zones
        </h2>
        <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Open reports and cleanups per zone. Pick a zone to see its weekly
            trend.
        </p>

        <div
            v-if="statsError"
            role="alert"
            class="mt-6 flex flex-wrap items-center gap-3 text-sm text-red-600 dark:text-red-400"
        >
            Couldn't load zone stats.
            <SharedButton variant="secondary" @click="refreshStats()">
                Retry
            </SharedButton>
        </div>

        <AppEmptyState
            v-else-if="!dashboard?.zones.length"
            icon="lucide:chart-pie"
            title="No zones yet"
            description="Zones are set up in the database. Once there are some, their stats show up here."
        />

        <template v-else>
            <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <ZonesCard
                    name="All zones"
                    :stats="dashboard.city"
                    :selected="!zoneId"
                    @select="select(null)"
                />
                <ZonesCard
                    v-for="z in dashboard.zones"
                    :key="z.id"
                    :name="z.name"
                    :stats="z"
                    :selected="z.id === zoneId"
                    @select="select(z.id)"
                />
            </div>

            <section
                aria-labelledby="trend-title"
                class="mt-6 rounded-xl p-5 ring-1 ring-zinc-900/10 dark:ring-white/10"
            >
                <h3
                    id="trend-title"
                    class="text-sm font-semibold text-zinc-900 dark:text-white"
                >
                    Reports per week ·
                    {{ selected?.name ?? "All zones" }}
                </h3>
                <p class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Last {{ TREND_WEEKS }} weeks, Monday to Sunday.
                </p>

                <div
                    v-if="trendError"
                    role="alert"
                    class="mt-6 flex flex-wrap items-center gap-3 text-sm text-red-600 dark:text-red-400"
                >
                    {{
                        trendError.statusCode === 404
                            ? "That zone doesn't exist."
                            : "Couldn't load the weekly trend."
                    }}
                    <SharedButton
                        v-if="trendError.statusCode === 404"
                        variant="secondary"
                        @click="select(null)"
                    >
                        Show all zones
                    </SharedButton>
                    <SharedButton
                        v-else
                        variant="secondary"
                        @click="refreshTrend()"
                    >
                        Retry
                    </SharedButton>
                </div>
                <ZonesTrend
                    v-else
                    :weeks="weeks"
                    class="mt-4 transition-opacity"
                    :class="trendPending && 'opacity-60'"
                    :aria-busy="trendPending"
                />
            </section>
        </template>
    </div>
</template>
