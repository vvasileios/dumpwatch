<script setup lang="ts">
defineProps<{ name: string; stats: ZoneCounts; selected: boolean }>();
const emit = defineEmits<{ select: [] }>();
</script>

<template>
    <button
        type="button"
        :aria-pressed="selected"
        class="rounded-xl p-4 text-left transition focus-visible:ring-4 focus-visible:ring-emerald-600/25 focus-visible:outline-none"
        :class="
            selected
                ? 'bg-emerald-600/5 ring-2 ring-emerald-600'
                : 'ring-1 ring-zinc-900/10 hover:bg-zinc-900/5 dark:ring-white/10 dark:hover:bg-white/5'
        "
        @click="emit('select')"
    >
        <span
            class="block text-sm font-medium text-zinc-500 dark:text-zinc-400"
            >{{ name }}</span
        >
        <span
            class="mt-1 block text-3xl font-semibold text-zinc-900 dark:text-white"
        >
            {{ stats.open }}
            <span class="text-sm font-normal text-zinc-500 dark:text-zinc-400"
                >open</span
            >
        </span>

        <span class="mt-3 block space-y-1 text-sm">
            <span
                v-for="status in REPORT_STATUSES"
                :key="status"
                class="flex items-center gap-2"
            >
                <span
                    class="size-2 shrink-0 rounded-full"
                    :style="{ backgroundColor: reportStatusColors[status] }"
                    aria-hidden="true"
                />
                <span class="text-zinc-600 capitalize dark:text-zinc-400">{{
                    status
                }}</span>
                <span
                    class="ml-auto font-medium text-zinc-900 tabular-nums dark:text-white"
                    >{{ stats[status] }}</span
                >
            </span>
            <span
                class="flex items-center gap-2 border-t border-zinc-900/5 pt-2 dark:border-white/10"
            >
                <span class="text-zinc-600 dark:text-zinc-400"
                    >Avg. time to clear</span
                >
                <span
                    class="ml-auto font-medium text-zinc-900 tabular-nums dark:text-white"
                    >{{ formatHours(stats.avg_hours_to_clear) }}</span
                >
            </span>
        </span>
    </button>
</template>
