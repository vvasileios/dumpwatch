<script setup lang="ts">
const description = defineModel<string>("description", { required: true });
defineProps<{
    coords: string | null;
    locating: boolean;
    submitting: boolean;
    canSubmit: boolean;
    fieldErrors: { location?: string; description?: string };
    formError: string | null;
}>();
const emit = defineEmits<{ locate: []; submit: [] }>();

const { min: MIN, max: MAX } = REPORT_DESCRIPTION;
</script>

<template>
    <form
        class="flex flex-col gap-6 p-5 sm:p-6"
        novalidate
        @submit.prevent="emit('submit')"
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
                <SharedButton
                    variant="secondary"
                    icon="lucide:locate-fixed"
                    :loading="locating"
                    @click="emit('locate')"
                >
                    {{ locating ? "Locating…" : "Use my location" }}
                </SharedButton>
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

        <SharedField id="description" label="What did you find?">
            <SharedTextarea
                id="description"
                v-model="description"
                rows="5"
                :maxlength="MAX"
                placeholder="e.g. Old mattress and bags of rubble next to the bus stop"
                :invalid="!!fieldErrors.description"
                :aria-describedby="
                    fieldErrors.description
                        ? 'description-error description-count'
                        : 'description-count'
                "
            />
            <div class="mt-1.5 flex items-start justify-between gap-3 text-xs">
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
                    {{ description.trim().length }} / {{ MAX }}
                </p>
            </div>
        </SharedField>

        <p
            v-if="formError"
            role="alert"
            class="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-red-600/15 dark:bg-red-950/40 dark:text-red-300"
        >
            {{ formError }}
        </p>

        <div class="mt-auto flex items-center justify-end gap-3 pt-2">
            <SharedButton variant="ghost" to="/">Cancel</SharedButton>
            <SharedButton
                type="submit"
                :disabled="!canSubmit"
                :loading="submitting"
            >
                {{ submitting ? "Sending…" : "Send report" }}
            </SharedButton>
        </div>
    </form>
</template>
