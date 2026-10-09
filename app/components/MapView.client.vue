<script setup lang="ts">
import L from "leaflet";
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

const el = ref<HTMLElement>();
let map: L.Map | undefined;

onMounted(async () => {
    await nextTick();
    map = L.map(el.value!).setView([40.64, 22.94], 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
});

onBeforeUnmount(() => map?.remove());
</script>

<template>
    <div ref="el" class="h-screen" />
</template>
