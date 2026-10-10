export type ReportStatus = "open" | "assigned" | "cleared";

export interface Report {
    id: string;
    status: ReportStatus;
    description: string | null;
    lat: number;
    lng: number;
    reported_at: string;
    cleared_at: string | null;
}
