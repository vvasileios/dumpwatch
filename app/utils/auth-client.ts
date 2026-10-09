import { createAuthClient } from "better-auth/vue";
import {
    adminClient,
    organizationClient,
    twoFactorClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
    plugins: [adminClient({ ac, roles }), organizationClient(), twoFactorClient()],
});

export type Session = typeof authClient.$Infer.Session;

export async function signOut() {
    await authClient.signOut();
    await navigateTo("/login", { replace: true });
}
