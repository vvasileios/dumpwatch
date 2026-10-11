const res = await fetch("http://127.0.0.1:3001/api/auth/sign-in/email", {
    method: "POST",
    headers: { origin: "http://127.0.0.1:3001", "content-type": "application/json" },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
});
const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0]!)
    .find((c) => c.startsWith("better-auth.session_token=") && c.length > 26);
if (!cookie) {
    console.error(`Admin sign-in failed: ${res.status}`);
    process.exit(1);
}
console.log(cookie);

export {};
