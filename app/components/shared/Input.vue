<script setup lang="ts">
defineOptions({ inheritAttrs: false });
defineProps<{ invalid?: boolean }>();
const model = defineModel<string>({ required: true });
</script>

<template>
    <div class="relative">
        <input
            v-model="model"
            v-bind="$attrs"
            :class="[
                fieldClass(invalid),
                'block w-full px-3.5 py-2.5',
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
