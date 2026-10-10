<script setup lang="ts">
import L from "leaflet";

const props = defineProps<{
    center: { lat: number; lng: number } | null;
    radius: number;
    points: NearbyPoint[];
}>();
const emit = defineEmits<{ pick: [lat: number, lng: number] }>();

const el = ref<HTMLElement>();
let map: L.Map | undefined;
const searchArea = L.layerGroup();
const markers = L.layerGroup();
let circle: L.Circle | undefined;

function popupFor(p: NearbyPoint) {
    const root = document.createElement("div");
    const title = document.createElement("strong");
    title.className = "capitalize";
    title.textContent = p.type;
    const details = document.createElement("div");
    const fill = p.fill_level === null ? "Fill level unknown" : `${p.fill_level}% full`;
    details.textContent = `${fill} · ${formatDistance(p.meters)} away`;
    root.append(title, details);
    return root;
}

function drawSearchArea() {
    if (!map) return;
    searchArea.clearLayers();
    circle = undefined;
    const c = props.center;
    if (!c) return;

    if (!map.getBounds().contains([c.lat, c.lng])) {
        map.setView([c.lat, c.lng], Math.max(map.getZoom(), 15));
    }

    circle = L.circle([c.lat, c.lng], {
        radius: props.radius,
        color: "#059669",
        weight: 1.5,
        fillOpacity: 0.06,
        interactive: false,
    }).addTo(searchArea);

    L.circleMarker([c.lat, c.lng], {
        radius: 5,
        color: "#ffffff",
        weight: 2,
        fillColor: "#18181b",
        fillOpacity: 1,
        interactive: false,
    }).addTo(searchArea);
}

function drawMarkers() {
    markers.clearLayers();
    for (const p of props.points) {
        L.circleMarker([p.lat, p.lng], {
            radius: 7,
            color: "#ffffff",
            weight: 2,
            fillColor: pointTypeColors[p.type],
            fillOpacity: 0.95,
            bubblingMouseEvents: false,
        })
            .bindPopup(popupFor(p))
            .addTo(markers);
    }
}

onMounted(async () => {
    await nextTick();
    map = L.map(el.value!, { zoomControl: false }).setView([40.63, 22.945], 14);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    searchArea.addTo(map);
    markers.addTo(map);
    map.on("click", (e) => {
        const { lat, lng } = e.latlng.wrap();
        emit("pick", lat, lng);
    });
    drawSearchArea();
    drawMarkers();
});

watch(() => props.center, drawSearchArea);
watch(
    () => props.radius,
    (r) => circle?.setRadius(r),
);
watch(() => props.points, drawMarkers);

onBeforeUnmount(() => map?.remove());
</script>

<template>
    <div ref="el" class="h-full cursor-crosshair" />
</template>
