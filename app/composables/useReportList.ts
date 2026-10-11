export async function useReportList() {
    const filter = ref<ReportStatus | null>(null);
    const reports = ref<DumpReport[]>([]);
    const nextCursor = ref<string | null>(null);
    const loadingMore = ref(false);
    const saving = ref(new Set<string>());
    const actionError = ref<string | null>(null);
    let controller: AbortController | undefined;

    const firstPage = useFetch<DumpReportList>("/api/reports/list", {
        query: computed(() => ({ status: filter.value ?? undefined })),
    });
    const { data, pending, error } = firstPage;
    const canModerate = computed(() => data.value?.canModerate ?? false);

    function seed(page: DumpReportList | undefined) {
        reports.value = page?.reports ?? [];
        nextCursor.value = page?.nextCursor ?? null;
    }

    watch(data, seed);

    watch(filter, () => {
        controller?.abort();
        nextCursor.value = null;
        actionError.value = null;
    });

    async function loadMore() {
        if (!nextCursor.value || loadingMore.value) return;
        const current = new AbortController();
        controller = current;
        loadingMore.value = true;
        actionError.value = null;
        try {
            const page = await $fetch<DumpReportList>("/api/reports/list", {
                query: {
                    status: filter.value ?? undefined,
                    cursor: nextCursor.value,
                },
                signal: current.signal,
            });
            reports.value.push(...page.reports);
            nextCursor.value = page.nextCursor;
        } catch (err) {
            if (current.signal.aborted) return;
            console.error(err);
            actionError.value = "Couldn't load more reports. Try again.";
        } finally {
            if (controller === current) loadingMore.value = false;
        }
    }

    async function updateStatus(report: DumpReport, status: ReportStatus) {
        saving.value.add(report.id);
        actionError.value = null;
        try {
            const updated = await $fetch<DumpReport>(
                `/api/reports/${report.id}`,
                { method: "PATCH", body: { status } },
            );
            const i = reports.value.findIndex((r) => r.id === updated.id);
            if (i !== -1) reports.value[i] = updated;
            return true;
        } catch (err) {
            console.error(err);
            actionError.value = `Couldn't update report #${report.id}. Try again.`;
            return false;
        } finally {
            saving.value.delete(report.id);
        }
    }

    onBeforeUnmount(() => controller?.abort());

    await firstPage;
    seed(data.value);

    return {
        reports,
        filter,
        nextCursor,
        pending,
        error,
        actionError,
        loadingMore,
        loadMore,
        saving,
        updateStatus,
        canModerate,
    };
}
