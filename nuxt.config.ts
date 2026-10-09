import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
    compatibilityDate: "2026-10-09",
    devtools: { enabled: true },
    modules: ["@nuxt/icon"],
    icon: {
        mode: "svg",
        serverBundle: { collections: ["lucide"], remote: false },
        clientBundle: { scan: true },
    },
    css: ["leaflet/dist/leaflet.css", "~/assets/css/main.css"],
    vite: {
        plugins: [tailwindcss()],
    },
    runtimeConfig: {
        databaseUrl: "",
    },
});
