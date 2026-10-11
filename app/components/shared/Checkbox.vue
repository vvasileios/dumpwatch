<script setup lang="ts">
const model = defineModel<boolean>({ required: true });
</script>

<template>
    <label
        class="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-600 select-none dark:text-zinc-400"
    >
        <input
            v-model="model"
            type="checkbox"
            class="size-4 rounded border-zinc-300 accent-emerald-600 dark:border-zinc-600"
        />
        <slot />
    </label>
</template>
