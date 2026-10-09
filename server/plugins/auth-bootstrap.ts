import { getMigrations } from "better-auth/db/migration";

export default defineNitroPlugin(async () => {
    const { runMigrations } = await getMigrations(auth.options);
    await runMigrations();

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
