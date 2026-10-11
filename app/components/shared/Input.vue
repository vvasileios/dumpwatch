<script setup lang="ts">
defineOptions({ inheritAttrs: false });
withDefaults(defineProps<{ invalid?: boolean; size?: "md" | "lg" }>(), {
    size: "md",
});
const model = defineModel<string>({ required: true });
</script>

<template>
    <div class="relative">
        <div
            v-if="$slots.leading"
            class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400"
        >
            <slot name="leading" />
        </div>
        <input
            v-model="model"
            v-bind="$attrs"
            :class="[
                fieldClass(invalid),
                'block w-full',
                size === 'lg' ? 'h-10 px-3.5' : 'h-9 px-3',
                $slots.leading && 'pl-9',
                $slots.trailing && 'pr-11',
            ]"
            :aria-invalid="invalid"
        />
        <div
            v-if="$slots.trailing"
            class="absolute inset-y-0 right-0 flex items-center pr-1.5"
        >
            <slot name="trailing" />
        </div>
    </div>
</template>
