export default defineNuxtRouteMiddleware(async (to) => {
    const session = await useRequestFetch()<Session | null>(
        "/api/auth/get-session",
    ).catch(() => null);
    useState<Session | null>("session").value = session;

    if (!session) {
        if (to.path === "/login") return;
        return navigateTo({ path: "/login", query: { redirect: to.fullPath } });
    }
    if (to.path === "/login") return navigateTo("/");
    if (to.meta.roles && !to.meta.roles.includes(session.user.role ?? "")) {
        return navigateTo("/");
    }
});
