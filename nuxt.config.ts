import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
    compatibilityDate: "2026-10-09",
    devtools: { enabled: true },
    css: ["leaflet/dist/leaflet.css", "~/assets/css/main.css"],
    vite: {
        plugins: [tailwindcss()],
    },
    runtimeConfig: {
        databaseUrl: "",
    },
});
