<script setup lang="ts">
defineProps<{ id: string; label: string }>();
</script>

<template>
    <div>
        <label
            :for="id"
            class="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >{{ label }}</label
        >
        <slot />
    </div>
</template>
