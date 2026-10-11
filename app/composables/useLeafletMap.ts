import L from "leaflet";

export function useLeafletMap(
    el: Ref<HTMLElement | undefined>,
    onReady: (map: L.Map) => void,
) {
    let map: L.Map | undefined;
    let observer: ResizeObserver | undefined;
    let disposed = false;

    onMounted(async () => {
        await nextTick();
        if (disposed || !el.value) return;
        map = L.map(el.value, {
            zoomControl: false,
            worldCopyJump: true,
        }).setView(
            [40.63, 22.945],
            14,
        );
        L.control.zoom({ position: "bottomright" }).addTo(map);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);
        observer = new ResizeObserver(() => map?.invalidateSize());
        observer.observe(el.value);
        onReady(map);
    });

    onBeforeUnmount(() => {
        disposed = true;
        observer?.disconnect();
        map?.remove();
        map = undefined;
    });
}
