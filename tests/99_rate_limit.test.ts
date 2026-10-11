import assert from "node:assert/strict";
import { test } from "node:test";
import { Client } from "./helpers.ts";

test("production build rate-limits sign-in attempts (429)", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
        const res = await new Client().post("/api/auth/sign-in/email", {
            email: "nobody@test.local",
            password: "wrong-password",
        });
        statuses.push(res.status);
    }
    assert.ok(statuses.includes(429), `got ${statuses.join(",")}`);
});
