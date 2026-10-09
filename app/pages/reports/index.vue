<template>
    <AppEmptyState icon="lucide:flag" title="No reports yet" description="Reports from citizens will show up here.">
        <NuxtLink
            to="/reports/new"
            class="mt-5 inline-flex items-center gap-1.5 rounded-lg border-b-[3px] border-emerald-800 bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-500 active:translate-y-px active:border-b"
        >
            <Icon name="lucide:plus" class="size-4" />
            Report dump
        </NuxtLink>
    </AppEmptyState>
</template>
