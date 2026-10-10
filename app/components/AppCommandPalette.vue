<script setup lang="ts">
interface Command {
    label: string;
    description?: string;
    icon: string;
    run: () => unknown;
}

const session = useState<Session | null>("session");
const open = useState("palette-open", () => false);
const dialog = ref<HTMLDialogElement>();
const input = ref<HTMLInputElement>();
const query = ref("");
const active = ref(0);

const commands = computed<Command[]>(() => [
    ...visibleNav(session.value?.user.role).map((i) => ({
        label: i.label,
        description: i.description,
        icon: i.icon,
        run: () => navigateTo(i.to),
    })),
    {
        label: "Report a dump",
        description: "Pin a new illegal dump",
        icon: "lucide:plus",
        run: () => navigateTo("/reports/new"),
    },
    { label: "Sign out", icon: "lucide:log-out", run: signOut },
]);

const results = computed(() => {
    const q = query.value.trim().toLowerCase();
    if (!q) return commands.value;
    return commands.value.filter((c) =>
        `${c.label} ${c.description ?? ""}`.toLowerCase().includes(q),
    );
});

watch(results, () => (active.value = 0));
watch(open, async (isOpen) => {
    if (!isOpen) return dialog.value?.close();
    query.value = "";
    dialog.value?.showModal();
    await nextTick();
    input.value?.focus();
});

function run(cmd?: Command) {
    if (!cmd) return;
    open.value = false;
    cmd.run();
}

function move(step: number) {
    const n = results.value.length;
    if (n) active.value = (active.value + step + n) % n;
}

function onKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        open.value = !open.value;
    }
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
    <dialog
        ref="dialog"
        aria-label="Quick navigation"
        class="m-0 mx-auto mt-[12vh] w-[calc(100%-1rem)] max-w-lg overflow-hidden rounded-2xl bg-white p-0 shadow-2xl ring-1 ring-zinc-900/10 backdrop:bg-zinc-950/40 backdrop:backdrop-blur-sm dark:bg-zinc-900 dark:ring-white/10"
        @close="open = false"
        @click.self="open = false"
    >
        <div
            class="flex items-center gap-3 border-b border-zinc-900/5 px-4 dark:border-white/10"
        >
            <Icon name="lucide:search" class="size-5 text-zinc-400" />
            <input
                ref="input"
                v-model="query"
                type="text"
                placeholder="Search pages and actions…"
                class="h-14 flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-white"
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-results"
                :aria-activedescendant="
                    results.length ? `palette-${active}` : undefined
                "
                @keydown.down.prevent="move(1)"
                @keydown.up.prevent="move(-1)"
                @keydown.enter.prevent="run(results[active])"
            />
            <kbd
                class="rounded bg-zinc-900/5 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-white/10 dark:text-zinc-400"
                >Esc</kbd
            >
        </div>

        <ul
            v-if="results.length"
            id="palette-results"
            role="listbox"
            class="max-h-[min(60vh,28rem)] overflow-y-auto p-2"
        >
            <li
                v-for="(cmd, i) in results"
                :id="`palette-${i}`"
                :key="cmd.label"
                role="option"
                :aria-selected="i === active"
                class="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm"
                :class="
                    i === active
                        ? 'bg-emerald-600/10 text-emerald-800 dark:text-emerald-200'
                        : 'text-zinc-700 dark:text-zinc-300'
                "
                @mousemove="active = i"
                @click="run(cmd)"
            >
                <Icon
                    :name="cmd.icon"
                    class="size-5 shrink-0"
                    :class="i === active ? 'text-emerald-600' : 'text-zinc-400'"
                />
                <span class="flex-1">
                    <span class="block font-medium">{{ cmd.label }}</span>
                    <span
                        v-if="cmd.description"
                        class="block text-xs text-zinc-500 dark:text-zinc-400"
                        >{{ cmd.description }}</span
                    >
                </span>
                <span
                    v-if="i === active"
                    class="text-xs text-zinc-400"
                    aria-hidden="true"
                    >↵</span
                >
            </li>
        </ul>
        <p v-else class="px-4 py-10 text-center text-sm text-zinc-500">
            No results for “{{ query }}”
        </p>
    </dialog>
</template>
