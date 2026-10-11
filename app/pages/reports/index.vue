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

const filterOptions = [
    { value: null, label: "All statuses" },
    ...reportStatusOptions,
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

        <ReportsTable
            v-else
            :reports="reports"
            :can-moderate="canModerate"
            :saving="saving"
            class="mt-6"
            :class="pending && 'opacity-60'"
            :aria-busy="pending"
            @status="updateStatus"
        />

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
