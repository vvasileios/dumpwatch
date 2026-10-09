import pg from "pg";

let pool: pg.Pool | undefined;

export function db() {
    pool ??= new pg.Pool({ connectionString: useRuntimeConfig().databaseUrl });
    return pool;
}
