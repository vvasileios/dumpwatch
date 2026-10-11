<script setup lang="ts">
defineProps<{
    reports: ReportWithNearest[];
    canModerate: boolean;
    saving: Set<string>;
    sort: ReportSort;
    dir: SortDir;
}>();
const emit = defineEmits<{
    status: [report: ReportWithNearest, status: ReportStatus];
    sort: [key: ReportSort];
}>();

const columns: { key: string; label: string; sort?: ReportSort; class?: string }[] = [
    { key: "id", label: "#", class: "font-mono text-zinc-500 tabular-nums dark:text-zinc-400" },
    { key: "status", label: "Status", sort: "status" },
    { key: "description", label: "Description", class: "max-w-md truncate text-zinc-800 dark:text-zinc-100" },
    { key: "nearest", label: "Nearest point" },
    { key: "reported", label: "Reported", sort: "reported", class: "whitespace-nowrap text-zinc-500 dark:text-zinc-400" },
    { key: "cleared", label: "Cleared", sort: "cleared", class: "whitespace-nowrap text-zinc-500 dark:text-zinc-400" },
];
</script>

<template>
    <SharedTable
        label="Reports"
        :rows="reports"
        :columns="columns"
        :sort="sort"
        :dir="dir"
        @sort="emit('sort', $event)"
    >
        <template #cell-status="{ row }">
            <div class="flex items-center gap-2">
                <span
                    class="size-2 shrink-0 rounded-full"
                    :style="{ backgroundColor: reportStatusColors[row.status] }"
                    aria-hidden="true"
                />
                <SharedSelect
                    v-if="canModerate"
                    :model-value="row.status"
                    :options="reportStatusOptions"
                    size="sm"
                    :disabled="saving.has(row.id)"
                    :aria-label="`Status of report #${row.id}`"
                    class="capitalize"
                    @update:model-value="emit('status', row, $event)"
                />
                <span
                    v-else
                    class="font-medium text-zinc-800 capitalize dark:text-zinc-100"
                    >{{ row.status }}</span
                >
            </div>
        </template>
        <template #cell-description="{ row }">
            <span :title="row.description ?? undefined">{{
                row.description ?? "—"
            }}</span>
        </template>
        <template #cell-nearest="{ row }">
            <PointsBadge
                v-if="row.nearest"
                :type="row.nearest.type"
                :fill-level="row.nearest.fill_level"
                :meters="row.nearest.meters"
            />
            <span v-else aria-label="No collection point">—</span>
        </template>
        <template #cell-reported="{ row }">
            <NuxtTime
                :datetime="row.reported_at"
                day="numeric"
                month="short"
                year="numeric"
                hour="2-digit"
                minute="2-digit"
            />
        </template>
        <template #cell-cleared="{ row }">
            <NuxtTime
                v-if="row.cleared_at"
                :datetime="row.cleared_at"
                day="numeric"
                month="short"
                year="numeric"
            />
            <span v-else aria-label="Not cleared">—</span>
        </template>
    </SharedTable>
</template>
