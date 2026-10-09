export default defineNuxtRouteMiddleware(async (to) => {
    const session = await useRequestFetch()("/api/auth/get-session").catch(
        () => null,
    );

    if (!session && to.path !== "/login") {
        return navigateTo({ path: "/login", query: { redirect: to.fullPath } });
    }
    if (session && to.path === "/login") {
        return navigateTo("/");
    }
});
