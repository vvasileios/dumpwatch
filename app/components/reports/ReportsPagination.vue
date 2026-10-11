<script setup lang="ts">
const size = defineModel<number>("size", { required: true });
const props = defineProps<{ page: number; pageCount: number; total: number }>();
const emit = defineEmits<{ go: [page: number] }>();

const sizeOptions = REPORTS_PAGE_SIZES.map((n) => ({
    value: n as number,
    label: `${n} per page`,
}));

const from = computed(() => (props.page - 1) * size.value + 1);
const to = computed(() => Math.min(props.page * size.value, props.total));

const pages = computed(() => {
    const { page, pageCount } = props;
    const keep = [...new Set([1, page - 1, page, page + 1, pageCount])]
        .filter((p) => p >= 1 && p <= pageCount)
        .sort((a, b) => a - b);
    const out: (number | null)[] = [];
    for (const p of keep) {
        const prev = out.at(-1);
        if (typeof prev === "number" && p - prev === 2) out.push(prev + 1);
        else if (typeof prev === "number" && p - prev > 2) out.push(null);
        out.push(p);
    }
    return out;
});
</script>

<template>
    <nav
        aria-label="Pagination"
        class="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500 dark:text-zinc-400"
    >
        <p aria-live="polite">
            Showing
            <span class="font-medium text-zinc-900 tabular-nums dark:text-white"
                >{{ from }}–{{ to }}</span
            >
            of
            <span class="font-medium text-zinc-900 tabular-nums dark:text-white">{{
                total
            }}</span>
        </p>

        <div class="flex items-center gap-3">
            <SharedSelect
                v-model="size"
                :options="sizeOptions"
                size="sm"
                aria-label="Rows per page"
            />
            <div class="flex items-center gap-1">
                <SharedIconButton
                    icon="lucide:chevron-left"
                    label="Previous page"
                    :disabled="page <= 1"
                    @click="emit('go', page - 1)"
                />
                <span class="px-1 tabular-nums sm:hidden"
                    >{{ page }} / {{ pageCount }}</span
                >
                <ol class="hidden items-center gap-1 sm:flex">
                    <li v-for="(p, i) in pages" :key="p ?? `gap-${i}`">
                        <span v-if="p === null" class="px-1" aria-hidden="true"
                            >…</span
                        >
                        <button
                            v-else
                            type="button"
                            class="h-9 min-w-9 rounded-lg px-2 font-medium tabular-nums transition focus-visible:ring-4 focus-visible:ring-emerald-600/25 focus-visible:outline-none"
                            :class="
                                p === page
                                    ? 'bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'
                                    : 'text-zinc-600 hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white'
                            "
                            :aria-label="`Page ${p}`"
                            :aria-current="p === page ? 'page' : undefined"
                            @click="p !== page && emit('go', p)"
                        >
                            {{ p }}
                        </button>
                    </li>
                </ol>
                <SharedIconButton
                    icon="lucide:chevron-right"
                    label="Next page"
                    :disabled="page >= pageCount"
                    @click="emit('go', page + 1)"
                />
            </div>
        </div>
    </nav>
</template>
