import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

export const ac = createAccessControl({
    ...defaultStatements,
    report: ["create", "update", "delete", "moderate"],
    demo: ["manage"],
} as const);

export const roles = {
    user: ac.newRole({ report: ["create"] }),
    moderator: ac.newRole({
        report: ["create", "update", "delete", "moderate"],
    }),
    admin: ac.newRole({
        report: ["create", "update", "delete", "moderate"],
        demo: ["manage"],
        ...adminAc.statements,
    }),
};
