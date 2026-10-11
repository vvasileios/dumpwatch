import type { REPORT_SORTS, REPORT_STATUSES } from "../utils/reports";

export type ReportStatus = (typeof REPORT_STATUSES)[number];
export type ReportSort = (typeof REPORT_SORTS)[number];
export type SortDir = "asc" | "desc";
export type Bbox = [
    minLng: number,
    minLat: number,
    maxLng: number,
    maxLat: number,
];

export interface DumpReport {
    id: string;
    status: ReportStatus;
    description: string | null;
    lat: number;
    lng: number;
    reported_at: string;
    cleared_at: string | null;
}

export interface DumpReportList {
    reports: DumpReport[];
    total: number;
    page: number;
    canModerate: boolean;
}
