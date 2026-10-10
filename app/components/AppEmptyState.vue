<script setup lang="ts">
defineProps<{ icon: string; title: string; description: string }>();
</script>

<template>
    <div class="grid h-full place-items-center p-8">
        <div class="max-w-sm text-center">
            <span
                class="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/10 dark:bg-emerald-950 dark:text-emerald-400"
            >
                <Icon :name="icon" class="size-6" />
            </span>
            <h2
                class="mt-4 text-lg font-semibold text-zinc-900 dark:text-white"
            >
                {{ title }}
            </h2>
            <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {{ description }}
            </p>
            <slot />
        </div>
    </div>
</template>
