export default defineEventHandler(async () => {
    const { rows } = await db().query(
        "SELECT postgis_full_version() AS postgis",
    );
    return { ok: true, postgis: rows[0].postgis };
});
