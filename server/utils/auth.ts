import { betterAuth } from "better-auth";
import { admin, organization, twoFactor } from "better-auth/plugins";
import type { H3Event } from "h3";

export const auth = betterAuth({
    appName: "dumpwatch",
    database: db(),
    emailAndPassword: { enabled: true },
    session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
    },
    plugins: [admin({ ac, roles }), organization(), twoFactor()],
});

export async function requireSession(event: H3Event) {
    const session = await auth.api.getSession({ headers: event.headers });
    if (!session)
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    return session;
}

export async function requirePermission(
    event: H3Event,
    permissions: Record<string, string[]>,
) {
    const session = await requireSession(event);

    const success = await hasPermission(session, permissions);

    if (!success)
        throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    return session;
}

export async function hasPermission(
    session: { user: { role?: string | null } },
    permissions: Record<string, string[]>,
) {
    const { success } = await auth.api.userHasPermission({
        body: {
            role: (session.user.role ?? "user") as keyof typeof roles,
            permissions,
        },
    });
    return success;
}
