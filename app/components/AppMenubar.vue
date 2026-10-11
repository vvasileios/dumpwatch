<script setup lang="ts">
const session = useState<Session | null>("session");
const palette = useState("palette-open", () => false);
const mobileNav = ref<HTMLElement>();

const items = computed(() => visibleNav(session.value?.user.role));
const initials = computed(() =>
    (session.value?.user.name || session.value?.user.email || "?")
        .slice(0, 2)
        .toUpperCase(),
);
const shortcut = ref("Ctrl K");
onMounted(() => {
    if (/Mac|iPhone|iPad/.test(navigator.userAgent)) shortcut.value = "⌘K";
});

const link =
    "rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white";
const active =
    "!bg-emerald-600/10 !text-emerald-700 dark:!bg-emerald-400/10 dark:!text-emerald-300";
const panel =
    "fixed inset-auto m-0 rounded-xl border-0 bg-white p-1.5 text-sm shadow-xl ring-1 ring-zinc-900/10 dark:bg-zinc-900 dark:ring-white/10";
</script>

<template>
    <header class="relative z-10 px-2 pt-2 md:px-4 md:pt-3">
        <div
            class="flex h-12 items-center gap-1 rounded-xl bg-white/80 px-2 shadow-sm ring-1 ring-zinc-900/5 backdrop-blur-md dark:bg-zinc-900/80 dark:ring-white/10"
        >
            <NuxtLink
                to="/"
                class="mr-1 flex items-center gap-2 rounded-lg px-1.5 py-1 font-semibold text-zinc-900 dark:text-white"
            >
                <span
                    class="grid size-7 place-items-center rounded-lg bg-emerald-600 text-white"
                >
                    <Icon name="lucide:map-pin" class="size-4" />
                </span>
                dumpwatch
            </NuxtLink>

            <nav aria-label="Main" class="hidden items-center gap-0.5 md:flex">
                <NuxtLink
                    v-for="item in items"
                    :key="item.to"
                    :to="item.to"
                    :class="link"
                    :active-class="active"
                >
                    {{ item.label }}
                </NuxtLink>
            </nav>

            <div class="ml-auto flex items-center gap-1">
                <SharedButton
                    to="/reports/new"
                    icon="lucide:plus"
                    class="mr-1"
                >
                    <span class="hidden sm:inline">Report dump</span>
                    <span class="sr-only sm:hidden">Report dump</span>
                </SharedButton>

                <button
                    type="button"
                    class="hidden h-9 items-center gap-2 rounded-lg pr-1.5 pl-2.5 text-sm text-zinc-500 ring-1 ring-zinc-900/10 transition hover:text-zinc-900 hover:ring-zinc-900/20 focus-visible:ring-4 focus-visible:ring-emerald-600/25 focus-visible:outline-none md:inline-flex dark:text-zinc-400 dark:ring-white/10 dark:hover:text-white"
                    @click="palette = true"
                >
                    <Icon name="lucide:search" class="size-4" />
                    Search
                    <kbd
                        class="rounded bg-zinc-900/5 px-1.5 py-0.5 font-sans text-xs dark:bg-white/10"
                        >{{ shortcut }}</kbd
                    >
                </button>
                <SharedIconButton
                    icon="lucide:search"
                    label="Search"
                    class="md:hidden"
                    @click="palette = true"
                />

                <button
                    type="button"
                    popovertarget="user-menu"
                    class="ml-1 grid size-8 place-items-center rounded-full bg-zinc-900 text-xs font-semibold text-white ring-2 ring-white transition hover:bg-zinc-700 focus-visible:ring-emerald-600/40 focus-visible:outline-none dark:bg-white dark:text-zinc-900 dark:ring-zinc-900"
                    aria-label="Account menu"
                >
                    {{ initials }}
                </button>

                <SharedIconButton
                    icon="lucide:menu"
                    label="Open menu"
                    popovertarget="mobile-nav"
                    class="md:hidden"
                />
            </div>
        </div>

        <div
            id="user-menu"
            popover
            :class="[panel, 'top-16 right-2 w-64 md:right-4']"
        >
            <div class="px-3 py-2">
                <p class="truncate font-medium text-zinc-900 dark:text-white">
                    {{ session?.user.name }}
                </p>
                <p class="truncate text-zinc-500 dark:text-zinc-400">
                    {{ session?.user.email }}
                </p>
                <span
                    class="mt-2 inline-block rounded-full bg-emerald-600/10 px-2 py-0.5 text-xs font-medium text-emerald-700 capitalize dark:text-emerald-300"
                    >{{ session?.user.role ?? "user" }}</span
                >
            </div>
            <hr class="my-1 border-zinc-900/5 dark:border-white/10" />
            <button
                type="button"
                class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-zinc-700 transition hover:bg-zinc-900/5 dark:text-zinc-300 dark:hover:bg-white/10"
                @click="signOut"
            >
                <Icon name="lucide:log-out" class="size-4" />
                Sign out
            </button>
        </div>

        <nav
            id="mobile-nav"
            ref="mobileNav"
            popover
            aria-label="Main"
            :class="[panel, 'inset-x-2 top-16 w-auto']"
        >
            <NuxtLink
                v-for="item in items"
                :key="item.to"
                :to="item.to"
                class="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-zinc-900/5 dark:hover:bg-white/10"
                :active-class="active"
                @click="mobileNav?.hidePopover()"
            >
                <Icon
                    :name="item.icon"
                    class="size-5 text-emerald-600 dark:text-emerald-400"
                />
                <span>
                    <span
                        class="block font-medium text-zinc-900 dark:text-white"
                        >{{ item.label }}</span
                    >
                    <span
                        class="block text-xs text-zinc-500 dark:text-zinc-400"
                        >{{ item.description }}</span
                    >
                </span>
            </NuxtLink>
        </nav>
    </header>
</template>
