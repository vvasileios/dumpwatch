<script setup lang="ts">
defineProps<{
    reports: DumpReport[];
    canModerate: boolean;
    saving: Set<string>;
}>();
const emit = defineEmits<{ status: [report: DumpReport, status: ReportStatus] }>();
</script>

<template>
    <div
        class="overflow-x-auto rounded-xl ring-1 ring-zinc-900/10 transition-opacity dark:ring-white/10"
    >
        <table class="w-full text-left text-sm">
            <thead
                class="bg-zinc-50 text-xs text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400"
            >
                <tr>
                    <th scope="col" class="px-4 py-2.5 font-medium">#</th>
                    <th scope="col" class="px-4 py-2.5 font-medium">
                        Status
                    </th>
                    <th scope="col" class="px-4 py-2.5 font-medium">
                        Description
                    </th>
                    <th scope="col" class="px-4 py-2.5 font-medium">
                        Reported
                    </th>
                    <th scope="col" class="px-4 py-2.5 font-medium">
                        Cleared
                    </th>
                </tr>
            </thead>
            <tbody class="divide-y divide-zinc-900/5 dark:divide-white/10">
                <tr v-for="r in reports" :key="r.id">
                    <td
                        class="px-4 py-3 font-mono text-zinc-500 tabular-nums dark:text-zinc-400"
                    >
                        {{ r.id }}
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                            <span
                                class="size-2 shrink-0 rounded-full"
                                :style="{
                                    backgroundColor:
                                        reportStatusColors[r.status],
                                }"
                                aria-hidden="true"
                            />
                            <SharedSelect
                                v-if="canModerate"
                                :model-value="r.status"
                                :options="reportStatusOptions"
                                size="sm"
                                :disabled="saving.has(r.id)"
                                :aria-label="`Status of report #${r.id}`"
                                class="capitalize"
                                @update:model-value="emit('status', r, $event)"
                            />
                            <span
                                v-else
                                class="font-medium text-zinc-800 capitalize dark:text-zinc-100"
                                >{{ r.status }}</span
                            >
                        </div>
                    </td>
                    <td
                        class="max-w-md truncate px-4 py-3 text-zinc-800 dark:text-zinc-100"
                        :title="r.description ?? undefined"
                    >
                        {{ r.description ?? "—" }}
                    </td>
                    <td
                        class="px-4 py-3 whitespace-nowrap text-zinc-500 dark:text-zinc-400"
                    >
                        <NuxtTime
                            :datetime="r.reported_at"
                            day="numeric"
                            month="short"
                            year="numeric"
                            hour="2-digit"
                            minute="2-digit"
                        />
                    </td>
                    <td
                        class="px-4 py-3 whitespace-nowrap text-zinc-500 dark:text-zinc-400"
                    >
                        <NuxtTime
                            v-if="r.cleared_at"
                            :datetime="r.cleared_at"
                            day="numeric"
                            month="short"
                            year="numeric"
                        />
                        <span v-else aria-label="Not cleared">—</span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
