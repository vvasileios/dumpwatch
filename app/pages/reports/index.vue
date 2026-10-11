<script setup lang="ts">
const createdReport = useState<string | null>("report-created", () => null);
const created = createdReport.value;
createdReport.value = null;

const {
    reports,
    filter,
    nextCursor,
    pending,
    error,
    actionError,
    loadingMore,
    loadMore,
    saving,
    updateStatus,
    canModerate,
} = await useReportList();

const empty = computed(() => {
    if (filter.value)
        return {
            title: `No ${filter.value} reports`,
            description: "Try another status.",
        };
    if (canModerate.value)
        return {
            title: "No reports yet",
            description: "Reports from citizens will show up here.",
        };
    return {
        title: "You haven't reported anything yet",
        description:
            "Spotted a dump? Pin it on the map and the city team will take it from there.",
    };
});

const statusOptions = REPORT_STATUSES.map((s) => ({ value: s, label: s }));
const filterOptions = [
    { value: null, label: "All statuses" },
    ...statusOptions,
];
</script>

<template>
    <div class="mx-auto max-w-5xl p-5 sm:p-6">
        <p
            v-if="created"
            role="status"
            class="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-400/20"
        >
            <Icon name="lucide:circle-check" class="size-4 shrink-0" />
            Thanks! Report #{{ created }} is in. The city team will take it from
            here.
        </p>

        <div class="flex flex-wrap items-end gap-3">
            <div class="mr-auto">
                <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">
                    {{ canModerate ? "All reports" : "My reports" }}
                </h2>
                <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {{
                        canModerate
                            ? "Every report from citizens, newest first."
                            : "Reports you sent, newest first."
                    }}
                </p>
            </div>
            <SharedSelect
                v-model="filter"
                :options="filterOptions"
                aria-label="Filter by status"
                class="capitalize"
            />
            <SharedButton to="/reports/new" icon="lucide:plus">
                Report dump
            </SharedButton>
        </div>

        <p
            v-if="error"
            role="alert"
            class="mt-6 text-sm text-red-600 dark:text-red-400"
        >
            Couldn't load reports. Try again.
        </p>

        <div
            v-else-if="pending && !reports.length"
            class="mt-10 grid place-items-center"
        >
            <AppLoader label="Loading reports" />
        </div>

        <AppEmptyState
            v-else-if="!reports.length"
            :icon="filter ? 'lucide:filter-x' : 'lucide:flag'"
            :title="empty.title"
            :description="empty.description"
        />

        <div
            v-else
            class="mt-6 overflow-x-auto rounded-xl ring-1 ring-zinc-900/10 transition-opacity dark:ring-white/10"
            :class="pending && 'opacity-60'"
            :aria-busy="pending"
        >
            <table class="w-full text-left text-sm">
                <thead
                    class="bg-zinc-50 text-xs text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400"
                >
                    <tr>
                        <th scope="col" class="px-4 py-2.5 font-medium">#</th>
                        <th scope="col" class="px-4 py-2.5 font-medium">
                            Status
                        </th>
                        <th scope="col" class="px-4 py-2.5 font-medium">
                            Description
                        </th>
                        <th scope="col" class="px-4 py-2.5 font-medium">
                            Reported
                        </th>
                        <th scope="col" class="px-4 py-2.5 font-medium">
                            Cleared
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
                                    :options="statusOptions"
                                    size="sm"
                                    :disabled="saving.has(r.id)"
                                    :aria-label="`Status of report #${r.id}`"
                                    class="capitalize"
                                    @update:model-value="updateStatus(r, $event)"
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

        <p
            v-if="actionError"
            role="alert"
            class="mt-3 text-sm text-red-600 dark:text-red-400"
        >
            {{ actionError }}
        </p>

        <div v-if="nextCursor && !error" class="mt-4 flex justify-center">
            <SharedButton
                variant="secondary"
                :loading="loadingMore"
                @click="loadMore"
            >
                {{ loadingMore ? "Loading…" : "Load more" }}
            </SharedButton>
        </div>
    </div>
</template>
