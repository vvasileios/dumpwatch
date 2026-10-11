<script setup lang="ts">
withDefaults(
    defineProps<{
        variant?: "primary" | "secondary" | "ghost";
        size?: "md" | "lg";
        to?: string;
        type?: "button" | "submit";
        icon?: string;
        loading?: boolean;
        disabled?: boolean;
        block?: boolean;
    }>(),
    { variant: "primary", size: "md", type: "button" },
);

const NuxtLink = resolveComponent("NuxtLink");

const variants = {
    primary:
        "border-b-[3px] border-emerald-800 bg-emerald-600 font-semibold text-white hover:bg-emerald-500 focus-visible:ring-emerald-600/30 active:translate-y-px active:border-b",
    secondary:
        "font-medium text-zinc-700 ring-1 ring-zinc-900/10 hover:bg-zinc-900/5 focus-visible:ring-emerald-600/25 dark:text-zinc-200 dark:ring-white/10 dark:hover:bg-white/10",
    ghost: "font-medium text-zinc-600 hover:bg-zinc-900/5 hover:text-zinc-900 focus-visible:ring-emerald-600/25 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white",
};
const sizes = { md: "h-9 px-3", lg: "h-10 px-4" };
</script>

<template>
    <component
        :is="to ? NuxtLink : 'button'"
        :to="to"
        :type="to ? undefined : type"
        :disabled="to ? undefined : disabled || loading"
        :aria-busy="loading || undefined"
        :class="[
            'inline-flex items-center justify-center gap-1.5 rounded-lg text-sm transition focus-visible:ring-4 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60',
            variants[variant],
            sizes[size],
            block && 'w-full',
        ]"
    >
        <AppLoader v-if="loading" size="sm" :delay="0" />
        <Icon v-else-if="icon" :name="icon" class="size-4" />
        <slot />
    </component>
</template>
