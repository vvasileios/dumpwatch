<script setup lang="ts" generic="T extends { id: string }, S extends string = never">
const props = defineProps<{
    label: string;
    rows: T[];
    columns: { key: string; label: string; sort?: S; class?: string }[];
    sort?: S;
    dir?: SortDir;
}>();
const emit = defineEmits<{ sort: [key: S] }>();
defineSlots<{
    [K: `cell-${string}`]: (props: { row: T }) => unknown;
}>();

function cellValue(row: T, key: string) {
    return (row as Record<string, unknown>)[key] ?? "—";
}

const scroller = useTemplateRef("scroller");
watch(
    () => props.rows,
    () => scroller.value?.scrollTo({ top: 0 }),
);
</script>

<template>
    <div
        ref="scroller"
        class="max-h-[max(20rem,calc(100dvh-24rem))] overflow-auto rounded-xl ring-1 ring-zinc-900/10 transition-opacity dark:ring-white/10"
    >
        <table :aria-label="label" class="w-full text-left text-sm">
            <thead
                class="sticky top-0 z-10 bg-zinc-50 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            >
                <tr>
                    <th
                        v-for="col in columns"
                        :key="col.key"
                        scope="col"
                        class="px-4 py-2.5 font-medium whitespace-nowrap"
                        :aria-sort="
                            col.sort && sort === col.sort
                                ? dir === 'asc'
                                    ? 'ascending'
                                    : 'descending'
                                : undefined
                        "
                    >
                        <button
                            v-if="col.sort"
                            type="button"
                            class="-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition hover:bg-zinc-900/5 hover:text-zinc-900 focus-visible:ring-4 focus-visible:ring-emerald-600/25 focus-visible:outline-none dark:hover:bg-white/10 dark:hover:text-white"
                            :class="
                                sort === col.sort &&
                                'text-zinc-900 dark:text-white'
                            "
                            @click="emit('sort', col.sort)"
                        >
                            {{ col.label }}
                            <Icon
                                :name="
                                    sort !== col.sort
                                        ? 'lucide:chevrons-up-down'
                                        : dir === 'asc'
                                          ? 'lucide:arrow-up'
                                          : 'lucide:arrow-down'
                                "
                                class="size-3.5"
                            />
                        </button>
                        <template v-else>{{ col.label }}</template>
                    </th>
                </tr>
            </thead>
            <tbody class="divide-y divide-zinc-900/5 dark:divide-white/10">
                <tr v-for="row in rows" :key="row.id">
                    <td
                        v-for="col in columns"
                        :key="col.key"
                        :class="['px-4 py-3', col.class]"
                    >
                        <slot :name="`cell-${col.key}`" :row="row">
                            {{ cellValue(row, col.key) }}
                        </slot>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
