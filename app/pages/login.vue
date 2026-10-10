<script setup lang="ts">
definePageMeta({ layout: false });
useHead({ title: "Sign in · dumpwatch" });

const route = useRoute();

const step = ref<"credentials" | "totp">("credentials");
const email = ref("");
const password = ref("");
const rememberMe = ref(true);
const showPassword = ref(false);
const code = ref("");
const trustDevice = ref(true);
const loading = ref(false);
const error = ref("");

function redirectTarget() {
    const r = route.query.redirect;
    return typeof r === "string" && r.startsWith("/") && !r.startsWith("//")
        ? r
        : "/";
}

function describe(err: { status?: number; message?: string }) {
    if (err.status === 401) return "Incorrect email or password.";
    if (err.status === 429)
        return "Too many attempts. Wait a moment and try again.";
    return err.message || "Something went wrong. Please try again.";
}

async function signIn() {
    error.value = "";
    loading.value = true;
    const { data, error: err } = await authClient.signIn.email({
        email: email.value,
        password: password.value,
        rememberMe: rememberMe.value,
    });
    loading.value = false;

    if (err) {
        error.value = describe(err);
        return;
    }
    if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
        step.value = "totp";
        return;
    }
    await navigateTo(redirectTarget(), { replace: true });
}

async function verifyCode() {
    if (loading.value) return;
    error.value = "";
    loading.value = true;
    const { error: err } = await authClient.twoFactor.verifyTotp({
        code: code.value,
        trustDevice: trustDevice.value,
    });
    loading.value = false;

    if (err) {
        error.value =
            err.status === 401
                ? "That code didn't work. Try the latest one."
                : describe(err);
        code.value = "";
        return;
    }
    await navigateTo(redirectTarget(), { replace: true });
}

function onCodeInput() {
    code.value = code.value.replace(/\D/g, "").slice(0, 6);
    if (code.value.length === 6) verifyCode();
}

function backToCredentials() {
    step.value = "credentials";
    code.value = "";
    error.value = "";
}

const input =
    "block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-xs transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/15 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-emerald-500";
const checkbox =
    "size-4 rounded border-zinc-300 accent-emerald-600 dark:border-zinc-600";
const button =
    "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:ring-4 focus-visible:ring-emerald-600/30 focus-visible:outline-none active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70";
</script>

<template>
    <div class="grid min-h-dvh bg-white lg:grid-cols-2 dark:bg-zinc-950">
        <aside
            class="relative hidden overflow-hidden bg-emerald-950 p-12 text-emerald-50 lg:flex lg:flex-col lg:justify-between"
        >
            <div
                class="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-emerald-500/30 blur-3xl"
            />
            <div
                class="pointer-events-none absolute -right-24 -bottom-40 size-112 rounded-full bg-teal-400/20 blur-3xl"
            />
            <div
                class="pointer-events-none absolute inset-0 opacity-[0.07] bg-[radial-gradient(currentColor_1px,transparent_1px)] bg-size-[22px_22px]"
            />

            <div
                class="relative flex items-center gap-2.5 text-lg font-semibold"
            >
                <span
                    class="grid size-9 place-items-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-400/30"
                >
                    <Icon name="lucide:map-pin" class="size-5" />
                </span>
                dumpwatch
            </div>

            <div class="relative max-w-md">
                <h2 class="text-4xl leading-tight font-semibold tracking-tight">
                    Map it. Report it. Get it cleaned.
                </h2>
                <p class="mt-4 text-emerald-100/80">
                    Track illegal dumping across the city and coordinate
                    cleanups in one place.
                </p>
            </div>

            <p class="relative text-sm text-emerald-100/60">Thessaloniki</p>
        </aside>

        <main class="flex items-center justify-center px-4 py-12 sm:px-8">
            <div class="w-full max-w-sm">
                <div
                    class="mb-8 flex items-center gap-2.5 text-lg font-semibold text-zinc-900 lg:hidden dark:text-white"
                >
                    <span
                        class="grid size-9 place-items-center rounded-xl bg-emerald-600 text-white"
                    >
                        <Icon name="lucide:map-pin" class="size-5" />
                    </span>
                    dumpwatch
                </div>

                <template v-if="step === 'credentials'">
                    <h1
                        class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white"
                    >
                        Welcome back
                    </h1>
                    <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                        Sign in to continue to your dashboard.
                    </p>

                    <form
                        class="mt-8 space-y-5"
                        novalidate
                        @submit.prevent="signIn"
                    >
                        <div>
                            <label
                                for="email"
                                class="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                >Email</label
                            >
                            <input
                                id="email"
                                v-model.trim="email"
                                type="email"
                                autocomplete="username"
                                inputmode="email"
                                required
                                autofocus
                                placeholder="you@example.com"
                                :class="input"
                                :aria-invalid="!!error"
                                aria-describedby="form-error"
                            />
                        </div>

                        <div>
                            <label
                                for="password"
                                class="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                >Password</label
                            >
                            <div class="relative">
                                <input
                                    id="password"
                                    v-model="password"
                                    :type="showPassword ? 'text' : 'password'"
                                    autocomplete="current-password"
                                    required
                                    placeholder="••••••••"
                                    :class="[input, 'pr-11']"
                                    :aria-invalid="!!error"
                                    aria-describedby="form-error"
                                />
                                <button
                                    type="button"
                                    class="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-zinc-400 transition hover:text-zinc-600 focus-visible:text-emerald-600 focus-visible:outline-none dark:hover:text-zinc-200"
                                    :aria-label="
                                        showPassword
                                            ? 'Hide password'
                                            : 'Show password'
                                    "
                                    :aria-pressed="showPassword"
                                    @click="showPassword = !showPassword"
                                >
                                    <Icon
                                        v-if="!showPassword"
                                        name="lucide:eye"
                                        class="size-5"
                                    />
                                    <Icon
                                        v-else
                                        name="lucide:eye-off"
                                        class="size-5"
                                    />
                                </button>
                            </div>
                        </div>

                        <label
                            class="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-600 select-none dark:text-zinc-400"
                        >
                            <input
                                v-model="rememberMe"
                                type="checkbox"
                                :class="checkbox"
                            />
                            Keep me signed in
                        </label>

                        <p
                            v-if="error"
                            id="form-error"
                            role="alert"
                            class="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-red-600/15 dark:bg-red-950/40 dark:text-red-300"
                        >
                            <Icon
                                name="lucide:circle-alert"
                                class="mt-0.5 size-4 shrink-0"
                            />
                            {{ error }}
                        </p>

                        <button
                            type="submit"
                            :class="button"
                            :disabled="loading || !email || !password"
                            :aria-busy="loading"
                        >
                            <AppLoader
                                v-if="loading"
                                size="sm"
                                :delay="0"
                                label="Signing in"
                            />
                            {{ loading ? "Signing in…" : "Sign in" }}
                        </button>
                    </form>
                </template>

                <template v-else>
                    <h1
                        class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white"
                    >
                        Two-factor authentication
                    </h1>
                    <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                        Enter the 6-digit code from your authenticator app.
                    </p>

                    <form
                        class="mt-8 space-y-5"
                        novalidate
                        @submit.prevent="verifyCode"
                    >
                        <div>
                            <label for="code" class="sr-only"
                                >Authentication code</label
                            >
                            <input
                                id="code"
                                v-model="code"
                                type="text"
                                inputmode="numeric"
                                autocomplete="one-time-code"
                                maxlength="6"
                                autofocus
                                placeholder="000000"
                                :class="[
                                    input,
                                    'text-center font-mono text-2xl tracking-[0.5em]',
                                ]"
                                :aria-invalid="!!error"
                                aria-describedby="form-error"
                                @input="onCodeInput"
                            />
                        </div>

                        <label
                            class="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-600 select-none dark:text-zinc-400"
                        >
                            <input
                                v-model="trustDevice"
                                type="checkbox"
                                :class="checkbox"
                            />
                            Trust this device for 30 days
                        </label>

                        <p
                            v-if="error"
                            id="form-error"
                            role="alert"
                            class="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-red-600/15 dark:bg-red-950/40 dark:text-red-300"
                        >
                            {{ error }}
                        </p>

                        <button
                            type="submit"
                            :class="button"
                            :disabled="loading || code.length !== 6"
                            :aria-busy="loading"
                        >
                            <AppLoader
                                v-if="loading"
                                size="sm"
                                :delay="0"
                                label="Verifying"
                            />
                            {{ loading ? "Verifying…" : "Verify" }}
                        </button>

                        <button
                            type="button"
                            class="w-full text-center text-sm font-medium text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                            @click="backToCredentials"
                        >
                            ← Use a different account
                        </button>
                    </form>
                </template>
            </div>
        </main>
    </div>
</template>
