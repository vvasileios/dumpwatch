<script setup lang="ts">
const createdReport = useState<string | null>("report-created", () => null);
const created = createdReport.value;
createdReport.value = null;
</script>

<template>
    <AppEmptyState
        :icon="created ? 'lucide:circle-check' : 'lucide:flag'"
        :title="created ? 'Report sent' : 'No reports yet'"
        :description="
            created
                ? `Thanks! Report #${created} is in. The city team will take it from here.`
                : 'Reports from citizens will show up here.'
        "
    >
        <NuxtLink
            to="/reports/new"
            class="mt-5 inline-flex items-center gap-1.5 rounded-lg border-b-[3px] border-emerald-800 bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-500 active:translate-y-px active:border-b"
        >
            <Icon name="lucide:plus" class="size-4" />
            {{ created ? "Report another" : "Report dump" }}
        </NuxtLink>
    </AppEmptyState>
</template>
