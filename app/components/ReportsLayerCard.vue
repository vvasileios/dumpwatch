<script setup lang="ts">
const show = defineModel<boolean>("show", { required: true });
const props = defineProps<{
    count: number;
    loadingReports: boolean;
    tooLarge: boolean;
    errorReports: string | null;
}>();

const reportsStatus = computed(() => {
    if (props.errorReports) return props.errorReports;
    if (props.tooLarge) return "Zoom in to see reports";
    if (props.loadingReports) return "Loading reports…";
    if (props.count === REPORTS_LIMIT)
        return `Latest ${REPORTS_LIMIT} shown, zoom in`;
    return `${props.count} reports`;
});
</script>

<template>
    <section
        aria-label="Reports layer"
        class="absolute top-3 right-3 z-1000 w-56 rounded-2xl bg-white/95 p-3 shadow-xl ring-1 ring-zinc-900/10 backdrop-blur dark:bg-zinc-900/95 dark:ring-white/10"
    >
        <button
            type="button"
            :aria-pressed="show"
            class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-900/5 focus-visible:ring-4 focus-visible:ring-emerald-600/25 focus-visible:outline-none dark:text-zinc-100 dark:hover:bg-white/10"
            @click="show = !show"
        >
            <Icon
                name="lucide:flag"
                class="size-4 text-red-600 dark:text-red-400"
            />
            Show reports
            <span
                class="ml-auto h-5 w-9 rounded-full p-0.5 transition"
                :class="
                    show ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'
                "
                aria-hidden="true"
            >
                <span
                    class="block size-4 rounded-full bg-white shadow transition"
                    :class="show && 'translate-x-4'"
                />
            </span>
        </button>

        <template v-if="show">
            <p
                class="mt-2 flex items-center gap-2 px-2 text-sm"
                :class="
                    errorReports
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-zinc-600 dark:text-zinc-400'
                "
            >
                <AppLoader
                    v-if="loadingReports"
                    size="sm"
                    :delay="0"
                />
                {{ reportsStatus }}
            </p>
            <p class="sr-only" role="status">
                {{ errorReports ?? (tooLarge ? "Zoom in to see reports" : "") }}
            </p>
            <ul
                class="mt-2 flex gap-3 px-2 text-xs text-zinc-600 dark:text-zinc-400"
            >
                <li
                    v-for="(color, status) in reportStatusColors"
                    :key="status"
                    class="flex items-center gap-1.5 capitalize"
                >
                    <span
                        class="size-2.5 rounded-full border-2 bg-white"
                        :style="{ borderColor: color }"
                        aria-hidden="true"
                    />
                    {{ status }}
                </li>
            </ul>
        </template>
    </section>
</template>
