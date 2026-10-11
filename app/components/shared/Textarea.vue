<script setup lang="ts">
defineProps<{ invalid?: boolean }>();
const model = defineModel<string>({ required: true });
</script>

<template>
    <textarea
        v-model="model"
        :class="[fieldClass(invalid), 'block w-full px-3.5 py-2.5']"
        :aria-invalid="invalid"
    />
</template>
