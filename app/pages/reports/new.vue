<script setup lang="ts">
import type { FetchError } from "ofetch";

definePageMeta({ title: "Report a dump" });

const { min: MIN, max: MAX } = REPORT_DESCRIPTION;
const DRAFT_KEY = "dumpwatch:report-draft";

type LatLng = { lat: number; lng: number };

const location = ref<LatLng | null>(null);
const description = ref("");
const submitting = ref(false);
const locating = ref(false);
const fieldErrors = ref<{ location?: string; description?: string }>({});
const formError = ref<string | null>(null);
const createdReport = useState<string | null>("report-created", () => null);

const trimmed = computed(() => description.value.trim());
const canSubmit = computed(
    () => !!location.value && trimmed.value.length >= MIN && !submitting.value,
);
const coords = computed(() =>
    location.value
        ? `${location.value.lat.toFixed(5)}, ${location.value.lng.toFixed(5)}`
        : null,
);

watch(location, () => (fieldErrors.value.location = undefined));
watch(description, () => (fieldErrors.value.description = undefined));

function saveDraft() {
    try {
        sessionStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({ location: location.value, description: description.value }),
        );
    } catch {}
}

function restoreDraft() {
    try {
        const raw = sessionStorage.getItem(DRAFT_KEY);
        sessionStorage.removeItem(DRAFT_KEY);
        if (!raw) return;
        const draft = JSON.parse(raw);
        const loc = draft?.location;
        if (loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) {
            location.value = { lat: loc.lat, lng: loc.lng };
        }
        if (typeof draft?.description === "string") {
            description.value = draft.description.slice(0, MAX);
        }
    } catch {}
}

onMounted(restoreDraft);

function useMyLocation() {
    if (!navigator.geolocation) {
        fieldErrors.value.location = "Location isn't available in this browser.";
        return;
    }
    const pickedBefore = location.value;
    locating.value = true;
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            locating.value = false;
            if (location.value !== pickedBefore) return;
            location.value = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        },
        () => {
            locating.value = false;
            if (location.value !== pickedBefore) return;
            fieldErrors.value.location = "Couldn't get your location. Click the map instead.";
        },
        { enableHighAccuracy: true, timeout: 10_000 },
    );
}

function handleError(err: unknown) {
    const e = err as FetchError;
    switch (e.statusCode) {
        case 422:
            fieldErrors.value.location =
                "That spot is outside the service area. Pick a place inside the city.";
            return;
        case 400: {
            const issues: Record<string, string[] | undefined> = e.data?.data ?? {};
            fieldErrors.value = {
                description: issues.description
                    ? `Describe it in ${MIN}–${MAX} characters.`
                    : undefined,
                location:
                    issues.lat || issues.lng
                        ? "That location isn't valid. Pick the spot on the map again."
                        : undefined,
            };
            if (!fieldErrors.value.description && !fieldErrors.value.location) {
                formError.value = "Please check the form and try again.";
            }
            return;
        }
        case 401:
            saveDraft();
            return navigateTo({ path: "/login", query: { redirect: "/reports/new" } });
        case 403:
            formError.value = "Your account isn't allowed to send reports.";
            return;
        default:
            formError.value = "Couldn't send the report. Try again.";
    }
}

async function submit() {
    if (!canSubmit.value || !location.value) return;
    submitting.value = true;
    fieldErrors.value = {};
    formError.value = null;
    try {
        const report = await $fetch<DumpReport>("/api/reports", {
            method: "POST",
            body: {
                lat: location.value.lat,
                lng: location.value.lng,
                description: trimmed.value,
            },
        });
        createdReport.value = report.id;
        await navigateTo("/reports");
    } catch (err) {
        await handleError(err);
    } finally {
        submitting.value = false;
    }
}

const field =
    "block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-xs transition placeholder:text-zinc-400 focus:ring-4 focus:outline-none dark:bg-zinc-900 dark:text-zinc-100";
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

        <form
            class="flex flex-col gap-6 border-t border-zinc-900/5 p-5 sm:p-6 lg:overflow-y-auto lg:border-t-0 lg:border-l dark:border-white/10"
            novalidate
            @submit.prevent="submit"
        >
            <div>
                <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">
                    Report a dump
                </h2>
                <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Pin the spot on the map, then describe what's there.
                </p>
            </div>

            <div>
                <span
                    class="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >Location</span
                >
                <div class="flex items-center gap-3">
                    <p
                        class="flex-1 text-sm"
                        :class="
                            coords
                                ? 'font-mono text-zinc-800 dark:text-zinc-100'
                                : 'text-zinc-500 dark:text-zinc-400'
                        "
                        aria-live="polite"
                    >
                        {{ coords ?? "No spot picked yet" }}
                    </p>
                    <button
                        type="button"
                        class="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-zinc-700 ring-1 ring-zinc-900/10 transition hover:bg-zinc-900/5 focus-visible:ring-4 focus-visible:ring-emerald-600/25 focus-visible:outline-none disabled:opacity-60 dark:text-zinc-200 dark:ring-white/10 dark:hover:bg-white/10"
                        :disabled="locating"
                        @click="useMyLocation"
                    >
                        <AppLoader
                            v-if="locating"
                            size="sm"
                            :delay="0"
                        />
                        <Icon
                            v-else
                            name="lucide:locate-fixed"
                            class="size-4"
                        />
                        {{ locating ? "Locating…" : "Use my location" }}
                    </button>
                </div>
                <p
                    v-if="fieldErrors.location"
                    id="location-error"
                    role="alert"
                    class="mt-2 flex items-start gap-1.5 text-sm text-red-600 dark:text-red-400"
                >
                    <Icon
                        name="lucide:circle-alert"
                        class="mt-0.5 size-4 shrink-0"
                    />
                    {{ fieldErrors.location }}
                </p>
            </div>

            <div>
                <label
                    for="description"
                    class="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                    What did you find?
                </label>
                <textarea
                    id="description"
                    v-model="description"
                    rows="5"
                    :maxlength="MAX"
                    placeholder="e.g. Old mattress and bags of rubble next to the bus stop"
                    :class="[
                        field,
                        fieldErrors.description
                            ? 'border-red-500 focus:ring-red-500/15'
                            : 'border-zinc-300 focus:border-emerald-600 focus:ring-emerald-600/15 dark:border-zinc-700',
                    ]"
                    :aria-invalid="!!fieldErrors.description"
                    :aria-describedby="
                        fieldErrors.description
                            ? 'description-error description-count'
                            : 'description-count'
                    "
                />
                <div
                    class="mt-1.5 flex items-start justify-between gap-3 text-xs"
                >
                    <p
                        v-if="fieldErrors.description"
                        id="description-error"
                        role="alert"
                        class="text-red-600 dark:text-red-400"
                    >
                        {{ fieldErrors.description }}
                    </p>
                    <p v-else class="text-zinc-500 dark:text-zinc-400">
                        At least {{ MIN }} characters.
                    </p>
                    <p
                        id="description-count"
                        class="shrink-0 text-zinc-400 tabular-nums"
                    >
                        {{ trimmed.length }} / {{ MAX }}
                    </p>
                </div>
            </div>

            <p
                v-if="formError"
                role="alert"
                class="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-red-600/15 dark:bg-red-950/40 dark:text-red-300"
            >
                {{ formError }}
            </p>

            <div class="mt-auto flex items-center justify-end gap-3 pt-2">
                <NuxtLink
                    to="/"
                    class="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                    Cancel
                </NuxtLink>
                <button
                    type="submit"
                    class="inline-flex items-center gap-2 rounded-lg border-b-[3px] border-emerald-800 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-600/30 focus-visible:outline-none active:translate-y-px active:border-b disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="!canSubmit"
                    :aria-busy="submitting"
                >
                    <AppLoader
                        v-if="submitting"
                        size="sm"
                        :delay="0"
                    />
                    {{ submitting ? "Sending…" : "Send report" }}
                </button>
            </div>
        </form>
    </div>
</template>
