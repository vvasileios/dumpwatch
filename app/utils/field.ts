export function fieldClass(invalid?: boolean) {
    return [
        "rounded-lg border bg-white text-sm text-zinc-900 shadow-xs transition placeholder:text-zinc-400 focus:ring-4 focus:outline-none disabled:opacity-60 dark:bg-zinc-900 dark:text-zinc-100",
        invalid
            ? "border-red-500 focus:ring-red-500/15"
            : "border-zinc-300 focus:border-emerald-600 focus:ring-emerald-600/15 dark:border-zinc-700",
    ];
}
