import type { FetchError } from "ofetch";

const DRAFT_KEY = "dumpwatch:report-draft";

type LatLng = { lat: number; lng: number };

export function useReportForm() {
    const { min: MIN, max: MAX } = REPORT_DESCRIPTION;

    const location = ref<LatLng | null>(null);
    const description = ref("");
    const submitting = ref(false);
    const locating = ref(false);
    const fieldErrors = ref<{ location?: string; description?: string }>({});
    const formError = ref<string | null>(null);
    const createdReport = useState<string | null>("report-created", () => null);

    const trimmed = computed(() => description.value.trim());
    const canSubmit = computed(
        () => !!location.value && trimmed.value.length >= MIN && !submitting.value,
    );
    const coords = computed(() =>
        location.value
            ? `${location.value.lat.toFixed(5)}, ${location.value.lng.toFixed(5)}`
            : null,
    );

    watch(location, () => (fieldErrors.value.location = undefined));
    watch(description, () => (fieldErrors.value.description = undefined));

    function saveDraft() {
        try {
            sessionStorage.setItem(
                DRAFT_KEY,
                JSON.stringify({ location: location.value, description: description.value }),
            );
        } catch {}
    }

    function restoreDraft() {
        try {
            const raw = sessionStorage.getItem(DRAFT_KEY);
            sessionStorage.removeItem(DRAFT_KEY);
            if (!raw) return;
            const draft = JSON.parse(raw);
            const loc = draft?.location;
            if (loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) {
                location.value = { lat: loc.lat, lng: loc.lng };
            }
            if (typeof draft?.description === "string") {
                description.value = draft.description.slice(0, MAX);
            }
        } catch {}
    }

    onMounted(restoreDraft);

    function locate() {
        if (!navigator.geolocation) {
            fieldErrors.value.location = "Location isn't available in this browser.";
            return;
        }
        const pickedBefore = location.value;
        locating.value = true;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                locating.value = false;
                if (location.value !== pickedBefore) return;
                location.value = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            },
            () => {
                locating.value = false;
                if (location.value !== pickedBefore) return;
                fieldErrors.value.location = "Couldn't get your location. Click the map instead.";
            },
            { enableHighAccuracy: true, timeout: 10_000 },
        );
    }

    function handleError(err: unknown) {
        const e = err as FetchError;
        switch (e.statusCode) {
            case 422:
                fieldErrors.value.location =
                    "That spot is outside the service area. Pick a place inside the city.";
                return;
            case 400: {
                const issues: Record<string, string[] | undefined> = e.data?.data ?? {};
                fieldErrors.value = {
                    description: issues.description
                        ? `Describe it in ${MIN}–${MAX} characters.`
                        : undefined,
                    location:
                        issues.lat || issues.lng
                            ? "That location isn't valid. Pick the spot on the map again."
                            : undefined,
                };
                if (!fieldErrors.value.description && !fieldErrors.value.location) {
                    formError.value = "Please check the form and try again.";
                }
                return;
            }
            case 401:
                saveDraft();
                return navigateTo({ path: "/login", query: { redirect: "/reports/new" } });
            case 403:
                formError.value = "Your account isn't allowed to send reports.";
                return;
            default:
                formError.value = "Couldn't send the report. Try again.";
        }
    }

    async function submit() {
        if (!canSubmit.value || !location.value) return;
        submitting.value = true;
        fieldErrors.value = {};
        formError.value = null;
        try {
            const report = await $fetch<DumpReport>("/api/reports", {
                method: "POST",
                body: {
                    lat: location.value.lat,
                    lng: location.value.lng,
                    description: trimmed.value,
                },
            });
            createdReport.value = report.id;
            await navigateTo("/reports");
        } catch (err) {
            await handleError(err);
        } finally {
            submitting.value = false;
        }
    }

    return {
        location,
        description,
        coords,
        locating,
        submitting,
        canSubmit,
        fieldErrors,
        formError,
        locate,
        submit,
    };
}
