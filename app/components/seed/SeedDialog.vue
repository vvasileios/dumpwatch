<script setup lang="ts">
const { open, overview, loading, busy, error, message, run } = useSeedData();
const dialog = ref<HTMLDialogElement>();
const confirming = ref<SeedEntity | null>(null);

const meta: Record<SeedEntity, { label: string; description: string; noun: string }> = {
    zones: {
        label: "Zones",
        description: "West, Center and East. They are the service area: nothing can be reported outside them.",
        noun: "zones",
    },
    points: {
        label: "Collection points",
        description: "50,000 bins of four types with random fill levels.",
        noun: "collection points",
    },
    reports: {
        label: "Reports",
        description: "500 dump reports from the last 60 days.",
        noun: "reports",
    },
    users: {
        label: "Demo users",
        description: "A citizen and a moderator, to try the app with other roles.",
        noun: "demo users",
    },
};

watch(open, (isOpen) => {
    confirming.value = null;
    if (isOpen) dialog.value?.showModal();
    else dialog.value?.close();
});

function counts(s: SeedStatus) {
    if (s.yours === null) return `${s.sample} of ${overview.value?.demoUsers.length ?? 0}`;
    return `${s.sample.toLocaleString()} sample · ${s.yours.toLocaleString()} yours`;
}

async function remove(s: SeedStatus) {
    confirming.value = null;
    await run(s.entity, "remove");
}
</script>

<template>
    <dialog
        ref="dialog"
        aria-labelledby="seed-title"
        class="m-auto w-[calc(100%-1rem)] max-w-xl overflow-hidden rounded-2xl bg-white p-0 shadow-2xl ring-1 ring-zinc-900/10 backdrop:bg-zinc-950/40 backdrop:backdrop-blur-sm dark:bg-zinc-900 dark:ring-white/10"
        @close="open = false"
        @click.self="open = false"
    >
        <div
            class="flex items-start gap-3 border-b border-zinc-900/5 px-5 py-4 dark:border-white/10"
        >
            <Icon
                name="lucide:wand-sparkles"
                class="mt-0.5 size-5 text-emerald-600 dark:text-emerald-400"
            />
            <div class="mr-auto">
                <h2
                    id="seed-title"
                    class="font-semibold text-zinc-900 dark:text-white"
                >
                    Sample data
                </h2>
                <p class="text-sm text-zinc-500 dark:text-zinc-400">
                    Add or remove demo data. Removing only deletes sample rows;
                    what you added stays.
                </p>
            </div>
            <SharedIconButton
                icon="lucide:x"
                label="Close"
                size="sm"
                @click="open = false"
            />
        </div>

        <div class="max-h-[70vh] overflow-y-auto">
            <div
                v-if="loading && !overview"
                class="grid place-items-center py-12"
            >
                <AppLoader label="Loading sample data" />
            </div>

            <ul
                v-else-if="overview"
                class="divide-y divide-zinc-900/5 dark:divide-white/10"
            >
                <li
                    v-for="s in overview.entities"
                    :key="s.entity"
                    class="px-5 py-4"
                >
                    <div class="flex items-start gap-4">
                        <div class="min-w-0 flex-1">
                            <p
                                class="font-medium text-zinc-900 dark:text-white"
                            >
                                {{ meta[s.entity].label }}
                            </p>
                            <p
                                class="text-sm text-zinc-500 dark:text-zinc-400"
                            >
                                {{ meta[s.entity].description }}
                            </p>
                            <p
                                class="mt-1 text-xs text-zinc-500 tabular-nums dark:text-zinc-400"
                            >
                                {{ counts(s) }}
                            </p>
                            <p
                                v-if="s.reason"
                                class="mt-1 text-xs text-amber-700 dark:text-amber-400"
                            >
                                {{ s.reason }}
                            </p>
                        </div>
                        <SharedButton
                            v-if="s.sample === 0 || (s.entity === 'users' && s.canSeed)"
                            :disabled="!s.canSeed || (!!busy && busy !== s.entity)"
                            :loading="busy === s.entity"
                            icon="lucide:plus"
                            @click="run(s.entity, 'seed')"
                        >
                            Seed
                        </SharedButton>
                        <SharedButton
                            v-else
                            variant="secondary"
                            :disabled="!s.canRemove || !!busy"
                            :loading="busy === s.entity"
                            icon="lucide:trash-2"
                            @click="confirming = s.entity"
                        >
                            Remove
                        </SharedButton>
                    </div>

                    <div
                        v-if="s.entity === 'users' && s.sample > 0"
                        class="mt-2 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:bg-white/5 dark:text-zinc-300"
                    >
                        <p v-for="u in overview.demoUsers" :key="u.email">
                            <span class="font-mono">{{ u.email }}</span>
                            <span class="text-zinc-400"> ({{ u.role }})</span>
                        </p>
                        <p class="mt-1">
                            Password:
                            <span class="font-mono">{{
                                overview.demoPassword
                            }}</span>
                        </p>
                    </div>

                    <div
                        v-if="confirming === s.entity"
                        role="alertdialog"
                        :aria-labelledby="`confirm-${s.entity}`"
                        class="mt-3 rounded-lg bg-red-50 p-3 text-sm ring-1 ring-red-600/15 dark:bg-red-950/40"
                    >
                        <p
                            :id="`confirm-${s.entity}`"
                            class="text-red-800 dark:text-red-200"
                        >
                            Delete {{ s.sample.toLocaleString() }} sample
                            {{ meta[s.entity].noun }}?
                            <template v-if="s.yours"
                                >Your {{ s.yours.toLocaleString() }} stay.</template
                            >
                            <template v-if="s.entity === 'users'"
                                >Their reports stay, without a reporter.</template
                            >
                        </p>
                        <p
                            v-if="s.warning"
                            class="mt-1 font-medium text-red-800 dark:text-red-200"
                        >
                            {{ s.warning }}
                        </p>
                        <div class="mt-3 flex justify-end gap-2">
                            <SharedButton
                                variant="ghost"
                                @click="confirming = null"
                            >
                                Cancel
                            </SharedButton>
                            <SharedButton variant="danger" @click="remove(s)">
                                Delete
                            </SharedButton>
                        </div>
                    </div>
                </li>
            </ul>
        </div>

        <p
            v-if="error || message"
            :role="error ? 'alert' : 'status'"
            class="border-t border-zinc-900/5 px-5 py-3 text-sm dark:border-white/10"
            :class="
                error
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-700 dark:text-emerald-400'
            "
        >
            {{ error ?? message }}
        </p>
    </dialog>
</template>
