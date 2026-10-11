import { after } from "node:test";
import pg from "pg";

export const BASE = "http://127.0.0.1:3001";

export const db = new pg.Pool({ connectionString: process.env.NUXT_DATABASE_URL });
after(() => db.end());

function sessionCookie(res: Response) {
    return res.headers
        .getSetCookie()
        .map((c) => c.split(";")[0]!)
        .find((c) => c.startsWith("better-auth.session_token=") && c.length > 26);
}

export type Res<T = any> = { status: number; data: T };

export class Client {
    cookie: string;

    constructor(cookie = "") {
        this.cookie = cookie;
    }

    async request<T = any>(method: string, path: string, body?: unknown): Promise<Res<T>> {
        const res = await fetch(BASE + path, {
            method,
            headers: {
                origin: BASE,
                cookie: this.cookie,
                ...(body === undefined ? {} : { "content-type": "application/json" }),
            },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
        const token = sessionCookie(res);
        if (token && !this.cookie) this.cookie = token;
        const text = await res.text();
        return { status: res.status, data: text ? JSON.parse(text) : null };
    }

    get<T = any>(path: string) {
        return this.request<T>("GET", path);
    }
    post<T = any>(path: string, body?: unknown) {
        return this.request<T>("POST", path, body);
    }
    patch<T = any>(path: string, body?: unknown) {
        return this.request<T>("PATCH", path, body);
    }
    delete<T = any>(path: string) {
        return this.request<T>("DELETE", path);
    }
}

export const anonymous = new Client();

let adminClient: Client | undefined;

export async function admin() {
    if (!process.env.TEST_ADMIN_COOKIE) throw new Error("TEST_ADMIN_COOKIE is not set (run make test)");
    adminClient ??= new Client(process.env.TEST_ADMIN_COOKIE);
    return adminClient;
}

let counter = 0;

export async function userWithRole(role: "user" | "moderator" | "admin") {
    const a = await admin();
    const email = `${role}-${Date.now()}-${++counter}@test.local`;
    const created = await a.post("/api/auth/admin/create-user", {
        email,
        password: "test-password-123",
        name: `Test ${role}`,
        role,
    });
    if (created.status !== 200) throw new Error(`create-user failed: ${created.status}`);
    const client = new Client();
    const res = await fetch(BASE + "/api/auth/admin/impersonate-user", {
        method: "POST",
        headers: { origin: BASE, cookie: a.cookie, "content-type": "application/json" },
        body: JSON.stringify({ userId: created.data.user.id }),
    });
    const token = sessionCookie(res);
    if (!token) throw new Error(`impersonate failed: ${res.status}`);
    client.cookie = token;
    return Object.assign(client, { id: created.data.user.id as string, email });
}

export const CITY = { lat: 40.6401, lng: 22.9444 };
export const SEA = { lat: 40.55, lng: 22.9 };
