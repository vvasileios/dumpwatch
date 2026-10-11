<script setup lang="ts">
const route = useRoute();
const maximized = useState("window-maximized", () => false);

const current = computed(() => navItems.find((i) => i.to === route.path));
const title = computed(
    () => route.meta.title ?? current.value?.label ?? "dumpwatch",
);

useHead({ title: () => `${title.value} · dumpwatch` });
</script>

<template>
    <div
        class="relative flex h-dvh flex-col overflow-hidden bg-emerald-50 dark:bg-zinc-950"
    >
        <div
            class="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_40rem_at_0%_0%,rgb(16_185_129/0.18),transparent),radial-gradient(50rem_40rem_at_100%_100%,rgb(20_184_166/0.15),transparent)]"
        />
        <div
            class="pointer-events-none absolute inset-0 text-emerald-900/10 bg-[radial-gradient(currentColor_1px,transparent_1px)] bg-size-[22px_22px] dark:text-white/5"
        />

        <AppMenubar />

        <div
            class="relative flex min-h-0 flex-1 pt-2 transition-[padding]"
            :class="maximized ? 'md:p-0 md:pt-2' : 'md:p-4 md:pt-3'"
        >
            <section
                class="flex min-w-0 flex-1 flex-col overflow-hidden bg-white shadow-xl ring-1 ring-zinc-900/5 dark:bg-zinc-900 dark:ring-white/10"
                :class="maximized ? 'md:rounded-none' : 'md:rounded-2xl'"
            >
                <header
                    class="hidden h-10 shrink-0 items-center gap-2 border-b border-zinc-900/5 px-3 text-sm md:flex dark:border-white/10"
                >
                    <Icon
                        v-if="current"
                        :name="current.icon"
                        class="size-4 text-emerald-600 dark:text-emerald-400"
                    />
                    <h1 class="font-medium text-zinc-800 dark:text-zinc-100">
                        {{ title }}
                    </h1>
                    <SharedIconButton
                        size="sm"
                        :icon="
                            maximized ? 'lucide:minimize-2' : 'lucide:maximize-2'
                        "
                        :label="
                            maximized ? 'Restore window' : 'Maximize window'
                        "
                        :aria-pressed="maximized"
                        class="ml-auto"
                        @click="maximized = !maximized"
                    />
                </header>
                <main class="relative isolate min-h-0 flex-1 overflow-y-auto">
                    <slot />
                </main>
            </section>
        </div>

        <AppCommandPalette />
    </div>
</template>
