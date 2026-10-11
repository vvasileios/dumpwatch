<script setup lang="ts" generic="T extends string | number | null">
withDefaults(
    defineProps<{
        options: { value: T; label: string }[];
        size?: "sm" | "md";
    }>(),
    { size: "md" },
);
const model = defineModel<T>({ required: true });
</script>

<template>
    <select
        v-model="model"
        :class="[fieldClass(), size === 'sm' ? 'h-8 px-2' : 'h-9 px-2.5']"
    >
        <option v-for="o in options" :key="String(o.value)" :value="o.value">
            {{ o.label }}
        </option>
    </select>
</template>
