<script setup lang="ts">
const route = useRoute();
const session = useState<Session | null>("session");
const maximized = useState("window-maximized", () => false);

const items = computed(() => visibleNav(session.value?.user.role));
const current = computed(() => navItems.find((i) => i.to === route.path));
const title = computed(() => route.meta.title ?? current.value?.label ?? "dumpwatch");

useHead({ title: () => `${title.value} · dumpwatch` });
</script>

<template>
    <div class="relative flex h-dvh flex-col overflow-hidden bg-emerald-50 dark:bg-zinc-950">
        <div
            class="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_40rem_at_0%_0%,rgb(16_185_129/0.18),transparent),radial-gradient(50rem_40rem_at_100%_100%,rgb(20_184_166/0.15),transparent)]"
        />
        <div
            class="pointer-events-none absolute inset-0 text-emerald-900/10 [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:22px_22px] dark:text-white/5"
        />

        <AppMenubar />

        <div class="relative flex min-h-0 flex-1 gap-3 pt-2 md:p-4 md:pt-3">
            <nav
                v-if="!maximized"
                aria-label="Quick launch"
                class="hidden w-24 shrink-0 flex-col items-center gap-1 xl:flex"
            >
                <NuxtLink
                    v-for="item in items"
                    :key="item.to"
                    :to="item.to"
                    class="group flex w-full flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 text-center text-xs font-medium text-zinc-700 transition hover:bg-white/60 dark:text-zinc-300 dark:hover:bg-white/5"
                    active-class="bg-white/70 !text-emerald-800 shadow-sm ring-1 ring-emerald-900/5 dark:bg-white/10 dark:!text-emerald-300"
                >
                    <span
                        class="grid size-12 place-items-center rounded-2xl bg-white text-emerald-600 shadow-sm ring-1 ring-zinc-900/5 transition group-hover:-translate-y-0.5 group-hover:shadow-md dark:bg-zinc-800 dark:text-emerald-400 dark:ring-white/10"
                    >
                        <Icon :name="item.icon" class="size-6" />
                    </span>
                    {{ item.label }}
                </NuxtLink>
            </nav>

            <section
                class="flex min-w-0 flex-1 flex-col overflow-hidden bg-white shadow-xl ring-1 ring-zinc-900/5 md:rounded-2xl dark:bg-zinc-900 dark:ring-white/10"
            >
                <header
                    class="hidden h-10 shrink-0 items-center gap-2 border-b border-zinc-900/5 px-3 text-sm md:flex dark:border-white/10"
                >
                    <Icon v-if="current" :name="current.icon" class="size-4 text-emerald-600 dark:text-emerald-400" />
                    <h1 class="font-medium text-zinc-800 dark:text-zinc-100">{{ title }}</h1>
                    <button
                        type="button"
                        class="ml-auto grid size-7 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-900/5 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
                        :aria-label="maximized ? 'Restore window' : 'Maximize window'"
                        :aria-pressed="maximized"
                        @click="maximized = !maximized"
                    >
                        <Icon :name="maximized ? 'lucide:minimize-2' : 'lucide:maximize-2'" class="size-4" />
                    </button>
                </header>
                <main class="relative isolate min-h-0 flex-1 overflow-y-auto">
                    <slot />
                </main>
            </section>
        </div>

        <AppCommandPalette />
    </div>
</template>
