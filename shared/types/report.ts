import type { REPORT_STATUSES } from "../utils/reports";

export type ReportStatus = (typeof REPORT_STATUSES)[number];
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
