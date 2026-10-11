<script setup lang="ts">
import L from "leaflet";

const props = defineProps<{
    center: { lat: number; lng: number } | null;
    radius: number;
    points: NearbyPoint[];
    reports: DumpReport[];
}>();

const emit = defineEmits<{
    pick: [lat: number, lng: number];
    bounds: [bbox: Bbox];
}>();

const el = ref<HTMLElement>();
let map: L.Map | undefined;
const searchArea = L.layerGroup();
const markers = L.layerGroup();
const reportMarkers = L.layerGroup();
let circle: L.Circle | undefined;

function emitBounds() {
    if (!map) return;
    const b = map.getBounds();
    emit("bounds", [
        Math.max(b.getWest(), -180),
        b.getSouth(),
        Math.min(b.getEast(), 180),
        b.getNorth(),
    ]);
}

function popupFor(p: NearbyPoint) {
    const root = document.createElement("div");
    const title = document.createElement("strong");
    title.className = "capitalize";
    title.textContent = p.type;
    const details = document.createElement("div");
    const fill =
        p.fill_level === null ? "Fill level unknown" : `${p.fill_level}% full`;
    details.textContent = `${fill} · ${formatDistance(p.meters)} away`;
    root.append(title, details);
    return root;
}

function reportPopupFor(r: DumpReport) {
    const root = document.createElement("div");
    const title = document.createElement("strong");
    title.className = "capitalize";
    title.textContent = r.status;
    const details = document.createElement("div");
    details.textContent = r.description;
    const date = document.createElement("div");
    date.className = "text-xs text-zinc-500";
    date.textContent = `Reported ${new Date(r.reported_at).toLocaleDateString()}`;
    root.append(title, details, date);
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

function drawReports() {
    reportMarkers.clearLayers();
    for (const r of props.reports) {
        L.circleMarker([r.lat, r.lng], {
            color: reportStatusColors[r.status],
            weight: 3,
            fillColor: "#ffffff",
            fillOpacity: 1,
            radius: 6,
            bubblingMouseEvents: false,
        })
            .bindPopup(reportPopupFor(r))
            .addTo(reportMarkers);
    }
}

useLeafletMap(el, (m) => {
    map = m;
    searchArea.addTo(m);
    markers.addTo(m);
    reportMarkers.addTo(m);
    m.on("moveend", emitBounds);
    m.on("click", (e) => {
        const { lat, lng } = e.latlng.wrap();
        emit("pick", lat, lng);
    });
    drawSearchArea();
    drawMarkers();
    drawReports();
    emitBounds();
});

watch(() => props.center, drawSearchArea);
watch(
    () => props.radius,
    (r) => circle?.setRadius(r),
);
watch(() => props.points, drawMarkers);

watch(() => props.reports, drawReports);
</script>

<template>
    <div ref="el" class="h-full cursor-crosshair" />
</template>
