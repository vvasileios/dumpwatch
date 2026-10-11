<script setup lang="ts">
withDefaults(
    defineProps<{ icon: string; label: string; size?: "sm" | "md" }>(),
    { size: "md" },
);
</script>

<template>
    <button
        type="button"
        :aria-label="label"
        :class="[
            'grid shrink-0 place-items-center transition hover:bg-zinc-900/5 focus-visible:ring-4 focus-visible:ring-emerald-600/25 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-white/10',
            size === 'sm'
                ? 'size-7 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                : 'size-9 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
        ]"
    >
        <Icon :name="icon" :class="size === 'sm' ? 'size-4' : 'size-5'" />
    </button>
</template>
