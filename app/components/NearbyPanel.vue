<script setup lang="ts">
const radius = defineModel<number>("radius", { required: true });
const props = defineProps<{
    points: NearbyPoint[];
    inServiceArea: boolean;
    loading: boolean;
    locating: boolean;
    error: string | null;
    hasCenter: boolean;
}>();
const emit = defineEmits<{ locate: [] }>();

const radii = [250, 500, 1000, 2000].map((r) => ({
    value: r,
    label: `Within ${formatDistance(r)}`,
}));

const status = computed(() => {
    if (props.error) return props.error;
    if (props.locating) return "Finding your location…";
    if (!props.hasCenter) return "Click the map to find collection points.";
    if (props.loading) return "Searching…";
    if (!props.inServiceArea)
        return "That spot is outside the service area. Pick a place inside the city zones.";
    const within = formatDistance(radius.value);
    if (!props.points.length) return `No collection points within ${within}.`;
    if (props.points.length === NEARBY_LIMIT)
        return `${NEARBY_LIMIT} closest points within ${within}`;
    return `${props.points.length} points within ${within}`;
});

const nearest = computed(() => props.points.slice(0, 5));
</script>

<template>
    <section
        aria-label="Nearby collection points"
        class="absolute inset-x-3 bottom-3 z-1000 rounded-2xl bg-white/95 p-4 shadow-xl ring-1 ring-zinc-900/10 backdrop-blur md:inset-x-auto md:top-3 md:bottom-auto md:left-3 md:w-80 dark:bg-zinc-900/95 dark:ring-white/10"
    >
        <div class="flex items-center gap-2">
            <Icon
                name="lucide:trash-2"
                class="size-4 text-emerald-600 dark:text-emerald-400"
            />
            <h2 class="text-sm font-semibold text-zinc-900 dark:text-white">
                Nearby collection points
            </h2>
        </div>

        <div class="mt-3 flex items-center gap-2">
            <SharedSelect
                v-model="radius"
                :options="radii"
                aria-label="Search radius"
                class="flex-1"
            />
            <SharedButton
                variant="secondary"
                icon="lucide:locate-fixed"
                :disabled="locating"
                @click="emit('locate')"
            >
                Near me
            </SharedButton>
        </div>

        <p
            class="mt-3 flex items-center gap-2 text-sm"
            :class="
                error
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-zinc-600 dark:text-zinc-400'
            "
            role="status"
            aria-live="polite"
        >
            <AppLoader
                v-if="loading || locating"
                size="sm"
                :delay="0"
            />
            {{ status }}
        </p>

        <ul v-if="nearest.length && !loading" class="mt-3 space-y-2">
            <li
                v-for="p in nearest"
                :key="p.id"
                class="flex items-center gap-3 text-sm"
            >
                <span
                    class="size-2.5 shrink-0 rounded-full ring-2 ring-white dark:ring-zinc-900"
                    :style="{ backgroundColor: pointTypeColors[p.type] }"
                    aria-hidden="true"
                />
                <span
                    class="w-20 font-medium text-zinc-800 capitalize dark:text-zinc-100"
                    >{{ p.type }}</span
                >
                <span
                    v-if="p.fill_level === null"
                    class="flex-1 text-xs text-zinc-400 dark:text-zinc-500"
                    >Fill unknown</span
                >
                <span
                    v-else
                    class="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-900/10 dark:bg-white/10"
                    role="meter"
                    :aria-valuenow="p.fill_level"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    :aria-label="`${p.fill_level}% full`"
                >
                    <span
                        class="block h-full rounded-full"
                        :class="
                            p.fill_level >= 80 ? 'bg-red-500' : 'bg-emerald-500'
                        "
                        :style="{ width: `${p.fill_level}%` }"
                    />
                </span>
                <span
                    class="w-14 text-right text-zinc-500 tabular-nums dark:text-zinc-400"
                    >{{ formatDistance(p.meters) }}</span
                >
            </li>
        </ul>
    </section>
</template>
