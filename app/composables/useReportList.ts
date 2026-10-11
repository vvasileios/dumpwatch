import type { LocationQuery } from "vue-router";

type ListQuery = {
    q: string;
    status: ReportStatus | null;
    page: number;
    size: number;
    sort: ReportSort;
    dir: SortDir;
};

const DIRS = ["asc", "desc"] as const;

function oneOf<T extends string | number>(list: readonly T[], value: unknown) {
    return list.find((item) => String(item) === value);
}

function parseQuery(query: LocationQuery): ListQuery {
    const get = (key: string) => {
        const value = query[key];
        return typeof value === "string" ? value : undefined;
    };
    const page = Number(get("page"));
    return {
        q: (get("q") ?? "").trim().slice(0, REPORT_SEARCH_MAX),
        status: oneOf(REPORT_STATUSES, get("status")) ?? null,
        page: Number.isInteger(page) && page >= 1 && page <= REPORTS_MAX_PAGE ? page : 1,
        size: oneOf(REPORTS_PAGE_SIZES, get("size")) ?? REPORTS_PAGE_SIZE,
        sort: oneOf(REPORT_SORTS, get("sort")) ?? "reported",
        dir: oneOf(DIRS, get("dir")) ?? "desc",
    };
}

function toQuery(list: ListQuery) {
    const query: Record<string, string> = {};
    if (list.q) query.q = list.q;
    if (list.status) query.status = list.status;
    if (list.page > 1) query.page = String(list.page);
    if (list.size !== REPORTS_PAGE_SIZE) query.size = String(list.size);
    if (list.sort !== "reported") query.sort = list.sort;
    if (list.dir !== "desc") query.dir = list.dir;
    return query;
}

export async function useReportList() {
    const route = useRoute();
    const router = useRouter();
    const params = computed(() => parseQuery(route.query));

    const reports = ref<ReportListItem[]>([]);
    const saving = ref(new Set<string>());
    const actionError = ref<string | null>(null);
    const search = ref(params.value.q);
    let searchTimer: ReturnType<typeof setTimeout> | undefined;

    const list = useFetch<DumpReportList>("/api/reports/list", {
        query: computed(() => toQuery(params.value)),
    });
    const { data, pending, error } = list;

    const canModerate = computed(() => data.value?.canModerate ?? false);
    const total = computed(() => data.value?.total ?? 0);
    const page = computed(() =>
        pending.value || !data.value ? params.value.page : data.value.page,
    );
    const pageCount = computed(() =>
        Math.max(1, Math.ceil(total.value / params.value.size)),
    );

    function update(patch: Partial<ListQuery>, replace = false) {
        const next = { page: 1, ...patch };
        const query = toQuery({ ...params.value, ...next });
        return replace ? router.replace({ query }) : router.push({ query });
    }

    const status = computed({
        get: () => params.value.status,
        set: (value) => update({ status: value }),
    });
    const size = computed({
        get: () => params.value.size,
        set: (value) => update({ size: value }),
    });

    function goTo(target: number) {
        update({ page: Math.min(Math.max(1, target), pageCount.value) });
    }

    function toggleSort(key: ReportSort) {
        const { sort, dir } = params.value;
        const firstDir = key === "status" ? "asc" : "desc";
        update({
            sort: key,
            dir: sort !== key ? firstDir : dir === "asc" ? "desc" : "asc",
        });
    }

    function clearFilters() {
        clearTimeout(searchTimer);
        update({ q: "", status: null });
    }

    function seed(page: DumpReportList | undefined) {
        reports.value = page?.reports ?? [];
    }

    watch(data, seed);
    watch(params, () => (actionError.value = null));

    watch(search, (value) => {
        clearTimeout(searchTimer);
        const q = value.trim();
        if (q === params.value.q) return;
        searchTimer = setTimeout(() => update({ q }, true), 300);
    });
    watch(
        () => params.value.q,
        (q) => {
            if (q !== search.value.trim()) search.value = q;
        },
    );
    onBeforeUnmount(() => clearTimeout(searchTimer));

    async function updateStatus(report: ReportListItem, status: ReportStatus) {
        const previous = report.status;
        report.status = status;
        saving.value.add(report.id);
        actionError.value = null;
        try {
            const updated = await $fetch<DumpReport>(
                `/api/reports/${report.id}`,
                { method: "PATCH", body: { status } },
            );
            const i = reports.value.findIndex((r) => r.id === updated.id);
            if (i !== -1) reports.value[i] = { ...reports.value[i]!, ...updated };
        } catch (err) {
            console.error(err);
            report.status = previous;
            actionError.value = `Couldn't update report #${report.id}. Try again.`;
        } finally {
            saving.value.delete(report.id);
        }
    }

    await list;
    seed(data.value);

    return {
        reports,
        params,
        search,
        status,
        size,
        page,
        pageCount,
        total,
        pending,
        error,
        actionError,
        saving,
        canModerate,
        goTo,
        toggleSort,
        clearFilters,
        updateStatus,
    };
}
