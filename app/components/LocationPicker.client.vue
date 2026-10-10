<script lang="ts" setup>
import L from "leaflet";

const location = defineModel<{ lat: number; lng: number } | null>("location", {
    required: true,
});

const el = ref<HTMLElement>();
let map: L.Map | undefined;
let pin: L.CircleMarker | undefined;

function drawPin() {
    if (!map) return;
    const loc = location.value;
    if (!loc) {
        pin?.remove();
        pin = undefined;
        return;
    }
    if (pin) pin.setLatLng([loc.lat, loc.lng]);
    else
        pin = L.circleMarker([loc.lat, loc.lng], {
            radius: 9,
            color: "#ffffff",
            weight: 3,
            fillColor: "#059669",
            fillOpacity: 1,
            interactive: false,
        }).addTo(map);
    if (!map.getBounds().contains([loc.lat, loc.lng])) {
        map.setView([loc.lat, loc.lng], Math.max(map.getZoom(), 16));
    }
}

useLeafletMap(el, (m) => {
    map = m;
    m.on("click", (e) => {
        const { lat, lng } = e.latlng.wrap();
        location.value = { lat, lng };
    });
    drawPin();
});

watch(location, drawPin);
</script>

<template>
    <div ref="el" class="h-full w-full cursor-crosshair" />
</template>
