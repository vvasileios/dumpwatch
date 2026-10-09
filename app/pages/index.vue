<script setup lang="ts">
useHead({ title: "Map · dumpwatch" });

const { data: session } = await useFetch("/api/auth/get-session");
const signingOut = ref(false);

async function signOut() {
    signingOut.value = true;
    await authClient.signOut();
    await navigateTo("/login", { replace: true });
}
</script>

<template>
    <div class="relative h-dvh">
        <ClientOnly>
            <MapView />
            <template #fallback>
                <AppLoader overlay size="lg" label="Loading map" :delay="0" />
            </template>
        </ClientOnly>

        <div
            class="absolute top-3 right-3 z-[1000] flex items-center gap-3 rounded-full bg-white/90 py-1.5 pr-1.5 pl-4 text-sm shadow-lg ring-1 ring-zinc-900/5 backdrop-blur dark:bg-zinc-900/90 dark:ring-white/10"
        >
            <span class="max-w-48 truncate text-zinc-700 dark:text-zinc-200">{{
                session?.user.email
            }}</span>
            <button
                type="button"
                class="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-1.5 font-medium text-white transition hover:bg-zinc-700 focus-visible:ring-4 focus-visible:ring-emerald-600/30 focus-visible:outline-none disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                :disabled="signingOut"
                @click="signOut"
            >
                <AppLoader
                    v-if="signingOut"
                    size="sm"
                    :delay="0"
                    label="Signing out"
                />
                Sign out
            </button>
        </div>
    </div>
</template>
