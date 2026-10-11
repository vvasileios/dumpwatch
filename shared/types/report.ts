import type { REPORT_SORTS, REPORT_STATUSES } from "../utils/reports";
import type { CollectionPointType } from "./collection-point";

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

export interface NearestPoint {
    id: string;
    type: CollectionPointType;
    fill_level: number | null;
    meters: number;
}

export interface ReportListItem extends DumpReport {
    nearest: NearestPoint | null;
}

export interface DumpReportList {
    reports: ReportListItem[];
    total: number;
    page: number;
    canModerate: boolean;
}
