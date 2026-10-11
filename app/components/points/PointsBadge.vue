<script setup lang="ts">
defineProps<{
    type: CollectionPointType;
    fillLevel: number | null;
    meters?: number;
}>();
</script>

<template>
    <span class="flex items-center gap-2 whitespace-nowrap">
        <span
            class="size-2 shrink-0 rounded-full"
            :style="{ backgroundColor: pointTypeColors[type] }"
            aria-hidden="true"
        />
        <span>
            <span class="text-zinc-800 capitalize dark:text-zinc-100">{{
                type
            }}</span
            ><template v-if="meters !== undefined"
                >{{ " " }}<span
                    class="text-zinc-500 tabular-nums dark:text-zinc-400"
                    >{{ formatDistance(meters) }}</span
                ></template
            ><template v-if="fillLevel !== null"
                >{{ " · " }}<span
                    class="tabular-nums"
                    :class="
                        fillLevel >= 80
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-zinc-500 dark:text-zinc-400'
                    "
                    >{{ fillLevel }}% full</span
                ></template
            >
        </span>
    </span>
</template>
