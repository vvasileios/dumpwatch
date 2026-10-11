<script setup lang="ts">
const createdReport = useState<string | null>("report-created", () => null);
const created = createdReport.value;
createdReport.value = null;

const {
    reports,
    params,
    search,
    status,
    size,
    page,
    pageCount,
    total,
    pending,
    error,
    actionError,
    saving,
    canModerate,
    goTo,
    toggleSort,
    clearFilters,
    updateStatus,
} = await useReportList();

const filtered = computed(() => !!params.value.q || !!params.value.status);

const empty = computed(() => {
    const { q, status } = params.value;
    if (q)
        return {
            title: `No ${status ? `${status} ` : ""}reports match “${q}”`,
            description: "Try another word or a report number like #42.",
        };
    if (status)
        return {
            title: `No ${status} reports`,
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
                            ? "Every report from citizens."
                            : "Reports you sent."
                    }}
                </p>
            </div>
            <SharedButton to="/reports/new" icon="lucide:plus">
                Report dump
            </SharedButton>
        </div>

        <div role="search" class="mt-5 flex flex-wrap items-center gap-3">
            <div class="min-w-56 flex-1">
                <SharedInput
                    v-model="search"
                    type="search"
                    placeholder="Search description or #number"
                    aria-label="Search reports"
                    :maxlength="REPORT_SEARCH_MAX"
                    class="[&::-webkit-search-cancel-button]:appearance-none"
                >
                    <template #leading>
                        <Icon name="lucide:search" class="size-4" />
                    </template>
                    <template v-if="search" #trailing>
                        <SharedIconButton
                            size="sm"
                            icon="lucide:x"
                            label="Clear search"
                            @click="search = ''"
                        />
                    </template>
                </SharedInput>
            </div>
            <SharedSelect
                v-model="status"
                :options="filterOptions"
                aria-label="Filter by status"
                class="capitalize"
            />
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
            :icon="filtered ? 'lucide:search-x' : 'lucide:flag'"
            :title="empty.title"
            :description="empty.description"
        >
            <SharedButton
                v-if="filtered"
                variant="secondary"
                class="mt-4"
                @click="clearFilters"
            >
                Clear filters
            </SharedButton>
        </AppEmptyState>

        <template v-else>
            <ReportsTable
                :reports="reports"
                :can-moderate="canModerate"
                :saving="saving"
                :sort="params.sort"
                :dir="params.dir"
                class="mt-4"
                :class="pending && 'opacity-60'"
                :aria-busy="pending"
                @status="updateStatus"
                @sort="toggleSort"
            />

            <p
                v-if="actionError"
                role="alert"
                class="mt-3 text-sm text-red-600 dark:text-red-400"
            >
                {{ actionError }}
            </p>

            <ReportsPagination
                v-model:size="size"
                :page="page"
                :page-count="pageCount"
                :total="total"
                class="mt-4"
                @go="goTo"
            />
        </template>
    </div>
</template>
