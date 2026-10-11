export const reportStatusColors: Record<ReportStatus, string> = {
    open: "#dc2626",
    assigned: "#7c3aed",
    cleared: "#a1a1aa",
};

export const reportStatusOptions = REPORT_STATUSES.map((s) => ({
    value: s,
    label: s,
}));
