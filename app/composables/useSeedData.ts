import type { FetchError } from "ofetch";

export function useCanSeed() {
    const session = useState<Session | null>("session");
    const config = useRuntimeConfig();
    return computed(
        () => config.public.demoTools && session.value?.user.role === "admin",
    );
}

export function useSeedData() {
    const open = useState("seed-open", () => false);
    const overview = ref<SeedOverview | null>(null);
    const loading = ref(false);
    const busy = ref<SeedEntity | null>(null);
    const error = ref<string | null>(null);
    const message = ref<string | null>(null);
    let latest = 0;

    async function load() {
        const request = ++latest;
        loading.value = true;
        error.value = null;
        try {
            const result = await $fetch<SeedOverview>("/api/admin/seed");
            if (request === latest) overview.value = result;
        } catch (err) {
            if (request !== latest) return;
            console.error(err);
            error.value = "Couldn't load the sample data status.";
        } finally {
            if (request === latest) loading.value = false;
        }
    }

    async function run(entity: SeedEntity, action: "seed" | "remove") {
        if (busy.value) return;
        busy.value = entity;
        error.value = null;
        message.value = null;
        latest++;
        try {
            overview.value = await $fetch<SeedOverview>(`/api/admin/seed/${entity}`, {
                method: action === "seed" ? "POST" : "DELETE",
            });
            message.value = action === "seed" ? "Sample data added." : "Sample data removed.";
            await refreshNuxtData();
        } catch (err) {
            const e = err as FetchError;
            console.error(err);
            error.value = e.data?.message ?? "Something went wrong. Try again.";
            await load();
        } finally {
            busy.value = null;
        }
    }

    watch(open, (isOpen) => {
        message.value = null;
        if (isOpen) load();
    });

    return { open, overview, loading, busy, error, message, run };
}
