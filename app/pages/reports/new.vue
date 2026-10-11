<script setup lang="ts">
definePageMeta({ title: "Report a dump" });

const {
    location,
    description,
    coords,
    locating,
    submitting,
    canSubmit,
    fieldErrors,
    formError,
    locate,
    submit,
} = useReportForm();
</script>

<template>
    <div class="grid min-h-full lg:h-full lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div class="relative h-[45vh] lg:h-full">
            <ClientOnly>
                <LocationPicker v-model:location="location" />
                <template #fallback>
                    <div class="grid h-full place-items-center">
                        <AppLoader size="lg" label="Loading map" :delay="0" />
                    </div>
                </template>
            </ClientOnly>
            <p
                class="pointer-events-none absolute top-3 left-3 z-1000 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-zinc-700 shadow ring-1 ring-zinc-900/10 backdrop-blur dark:bg-zinc-900/90 dark:text-zinc-200 dark:ring-white/10"
            >
                {{
                    coords
                        ? `Pinned at ${coords}`
                        : "Click the map to place the dump"
                }}
            </p>
        </div>

        <ReportsForm
            v-model:description="description"
            :coords="coords"
            :locating="locating"
            :submitting="submitting"
            :can-submit="canSubmit"
            :field-errors="fieldErrors"
            :form-error="formError"
            class="border-t border-zinc-900/5 lg:overflow-y-auto lg:border-t-0 lg:border-l dark:border-white/10"
            @locate="locate"
            @submit="submit"
        />
    </div>
</template>
