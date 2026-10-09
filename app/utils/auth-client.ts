import { createAuthClient } from "better-auth/vue";
import {
    adminClient,
    organizationClient,
    twoFactorClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
    plugins: [adminClient({ ac, roles }), organizationClient(), twoFactorClient()],
});
