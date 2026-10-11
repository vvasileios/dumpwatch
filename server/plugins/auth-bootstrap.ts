import { getMigrations } from "better-auth/db/migration";

export default defineNitroPlugin(async () => {
    const { toBeCreated, toBeAdded, compileMigrations } = await getMigrations(
        auth.options,
    );
    if (toBeCreated.length || toBeAdded.length) {
        const sql = await compileMigrations();
        throw new Error(
            `Better Auth schema is out of date. Add this SQL to a migration (make migration name=better_auth_update), then make migrate:\n\n${sql}`,
        );
    }

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) return;

    const { rows } = await db().query('SELECT 1 FROM "user" WHERE email = $1', [
        email,
    ]);
    if (!rows.length) {
        await auth.api.createUser({
            body: { email, password, name: "Admin", role: "admin" },
        });
    }
});
