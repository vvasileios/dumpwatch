<script setup lang="ts">
const props = defineProps<{ weeks: WeeklyCount[] }>();

const max = computed(() => Math.max(1, ...props.weeks.map((w) => w.reports)));
</script>

<template>
    <div>
        <p class="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
            max {{ max }}
        </p>
        <ol
            aria-label="Reports per week"
            class="mt-1 flex h-48 items-end gap-0.5 border-t border-b border-dashed border-t-zinc-900/10 border-b-zinc-900/20 dark:border-t-white/10 dark:border-b-white/20"
        >
            <li
                v-for="(w, i) in weeks"
                :key="w.week"
                tabindex="0"
                class="group relative flex h-full flex-1 items-end justify-center rounded-t outline-none focus-visible:bg-emerald-600/10"
            >
                <div
                    class="w-full max-w-6 rounded-t bg-emerald-600 transition-opacity group-hover:opacity-80"
                    :class="i === weeks.length - 1 && 'opacity-50'"
                    :style="{ height: `${(w.reports / max) * 100}%` }"
                    aria-hidden="true"
                />
                <span class="sr-only">
                    Week of
                    <NuxtTime
                        :datetime="w.week"
                        month="long"
                        day="numeric"
                        :time-zone="CITY_TIMEZONE"
                    />: {{ w.reports }} reports{{
                        i === weeks.length - 1 ? " so far" : ""
                    }}
                </span>
                <span
                    class="pointer-events-none absolute bottom-full z-10 mb-2 hidden rounded-md bg-zinc-900 px-2 py-1 text-xs whitespace-nowrap text-white shadow-lg group-hover:block group-focus:block dark:bg-white dark:text-zinc-900"
                    aria-hidden="true"
                >
                    Week of
                    <NuxtTime
                        :datetime="w.week"
                        month="short"
                        day="numeric"
                        :time-zone="CITY_TIMEZONE"
                    />
                    ·
                    <span class="font-semibold">{{ w.reports }}</span>
                    {{ i === weeks.length - 1 ? "so far" : "reports" }}
                </span>
            </li>
        </ol>
        <ol
            class="mt-1.5 flex gap-0.5 text-center text-xs text-zinc-500 dark:text-zinc-400"
            aria-hidden="true"
        >
            <li
                v-for="(w, i) in weeks"
                :key="w.week"
                class="flex min-w-0 flex-1 justify-center whitespace-nowrap"
                :class="i % 2 === 1 && 'max-sm:invisible'"
            >
                <NuxtTime
                    :datetime="w.week"
                    month="short"
                    day="numeric"
                    :time-zone="CITY_TIMEZONE"
                />
            </li>
        </ol>
    </div>
</template>
