<script setup lang="ts">
const props = defineProps<{
    reports: DumpReport[];
    canModerate: boolean;
    saving: Set<string>;
    sort: ReportSort;
    dir: SortDir;
}>();
const emit = defineEmits<{
    status: [report: DumpReport, status: ReportStatus];
    sort: [key: ReportSort];
}>();

const columns: { label: string; sort?: ReportSort }[] = [
    { label: "#" },
    { label: "Status", sort: "status" },
    { label: "Description" },
    { label: "Reported", sort: "reported" },
    { label: "Cleared", sort: "cleared" },
];

const scroller = useTemplateRef("scroller");
watch(
    () => props.reports,
    () => scroller.value?.scrollTo({ top: 0 }),
);
</script>

<template>
    <div
        ref="scroller"
        class="max-h-[max(20rem,calc(100dvh-24rem))] overflow-auto rounded-xl ring-1 ring-zinc-900/10 transition-opacity dark:ring-white/10"
    >
        <table class="w-full text-left text-sm">
            <thead
                class="sticky top-0 z-10 bg-zinc-50 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            >
                <tr>
                    <th
                        v-for="col in columns"
                        :key="col.label"
                        scope="col"
                        class="px-4 py-2.5 font-medium"
                        :aria-sort="
                            col.sort && sort === col.sort
                                ? dir === 'asc'
                                    ? 'ascending'
                                    : 'descending'
                                : undefined
                        "
                    >
                        <button
                            v-if="col.sort"
                            type="button"
                            class="-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition hover:bg-zinc-900/5 hover:text-zinc-900 focus-visible:ring-4 focus-visible:ring-emerald-600/25 focus-visible:outline-none dark:hover:bg-white/10 dark:hover:text-white"
                            :class="
                                sort === col.sort &&
                                'text-zinc-900 dark:text-white'
                            "
                            @click="emit('sort', col.sort)"
                        >
                            {{ col.label }}
                            <Icon
                                :name="
                                    sort !== col.sort
                                        ? 'lucide:chevrons-up-down'
                                        : dir === 'asc'
                                          ? 'lucide:arrow-up'
                                          : 'lucide:arrow-down'
                                "
                                class="size-3.5"
                            />
                        </button>
                        <template v-else>{{ col.label }}</template>
                    </th>
                </tr>
            </thead>
            <tbody class="divide-y divide-zinc-900/5 dark:divide-white/10">
                <tr v-for="r in reports" :key="r.id">
                    <td
                        class="px-4 py-3 font-mono text-zinc-500 tabular-nums dark:text-zinc-400"
                    >
                        {{ r.id }}
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                            <span
                                class="size-2 shrink-0 rounded-full"
                                :style="{
                                    backgroundColor:
                                        reportStatusColors[r.status],
                                }"
                                aria-hidden="true"
                            />
                            <SharedSelect
                                v-if="canModerate"
                                :model-value="r.status"
                                :options="reportStatusOptions"
                                size="sm"
                                :disabled="saving.has(r.id)"
                                :aria-label="`Status of report #${r.id}`"
                                class="capitalize"
                                @update:model-value="emit('status', r, $event)"
                            />
                            <span
                                v-else
                                class="font-medium text-zinc-800 capitalize dark:text-zinc-100"
                                >{{ r.status }}</span
                            >
                        </div>
                    </td>
                    <td
                        class="max-w-md truncate px-4 py-3 text-zinc-800 dark:text-zinc-100"
                        :title="r.description ?? undefined"
                    >
                        {{ r.description ?? "—" }}
                    </td>
                    <td
                        class="px-4 py-3 whitespace-nowrap text-zinc-500 dark:text-zinc-400"
                    >
                        <NuxtTime
                            :datetime="r.reported_at"
                            day="numeric"
                            month="short"
                            year="numeric"
                            hour="2-digit"
                            minute="2-digit"
                        />
                    </td>
                    <td
                        class="px-4 py-3 whitespace-nowrap text-zinc-500 dark:text-zinc-400"
                    >
                        <NuxtTime
                            v-if="r.cleared_at"
                            :datetime="r.cleared_at"
                            day="numeric"
                            month="short"
                            year="numeric"
                        />
                        <span v-else aria-label="Not cleared">—</span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
