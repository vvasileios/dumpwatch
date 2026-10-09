<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        size?: "sm" | "md" | "lg";
        label?: string;
        overlay?: boolean;
        delay?: number;
    }>(),
    { size: "md", label: "Loading", overlay: false, delay: 150 },
);

const sizes = { sm: "size-4", md: "size-8", lg: "size-12" };
const visible = ref(props.delay === 0);
let timer: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
    if (!visible.value) timer = setTimeout(() => (visible.value = true), props.delay);
});
onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
    <div
        v-if="visible"
        role="status"
        aria-live="polite"
        :class="
            overlay
                ? 'fixed inset-0 z-[1000] grid place-items-center bg-white/70 text-emerald-600 backdrop-blur-sm dark:bg-zinc-950/70 dark:text-emerald-400'
                : 'inline-flex items-center'
        "
    >
        <div class="flex flex-col items-center gap-3">
            <svg
                :class="[sizes[size], 'motion-safe:animate-spin']"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
            >
                <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="3"
                    class="opacity-20"
                />
                <path
                    d="M22 12a10 10 0 0 0-10-10"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                />
            </svg>
            <span
                :class="
                    overlay
                        ? 'text-sm font-medium text-zinc-600 dark:text-zinc-300'
                        : 'sr-only'
                "
                >{{ label }}</span
            >
        </div>
    </div>
</template>
