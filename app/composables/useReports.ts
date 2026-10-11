export function useReports() {
    const show = ref(false);
    const bbox = ref<Bbox | null>(null);
    const reports = ref<DumpReport[]>([]);
    const loadingReports = ref(false);
    const tooLarge = ref(false);
    const errorReports = ref<string | null>(null);

    let controller: AbortController | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    function stop() {
        clearTimeout(timer);
        controller?.abort();
        loadingReports.value = false;
        timer = undefined;
    }

    async function load(box: Bbox) {
        controller?.abort();
        const current = new AbortController();
        controller = current;
        loadingReports.value = true;

        try {
            const result = await $fetch<DumpReport[]>("/api/reports", {
                query: { bbox: box.join(",") },
                signal: current.signal,
            });
            reports.value = result;
        } catch (err) {
            if (current.signal.aborted) return;
            console.error(err);
            reports.value = [];
            errorReports.value = "Couldn't load reports. Try again.";
        } finally {
            if (controller === current) loadingReports.value = false;
        }
    }

    watch([show, bbox], ([on, box], [wasOn, oldBox]) => {
        stop();
        errorReports.value = null;
        tooLarge.value = false;
        if (!on || !box) {
            reports.value = [];
            loadingReports.value = on;
            return;
        }
        if (
            box[2] - box[0] > REPORTS_MAX_SPAN ||
            box[3] - box[1] > REPORTS_MAX_SPAN
        ) {
            tooLarge.value = true;
            reports.value = [];
            return;
        }
        if (wasOn && oldBox) timer = setTimeout(() => load(box), 300);
        else load(box);
    });

    onBeforeUnmount(() => stop());

    return {
        show,
        bbox,
        reports,
        loadingReports,
        tooLarge,
        errorReports,
    };
}
