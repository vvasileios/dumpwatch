export interface ZoneCounts {
    open: number;
    assigned: number;
    cleared: number;
    avg_hours_to_clear: number | null;
}

export interface ZoneStats extends ZoneCounts {
    id: string;
    name: string;
}

export interface ZoneDashboard {
    city: ZoneCounts;
    zones: ZoneStats[];
}

export interface WeeklyCount {
    week: string;
    reports: number;
}
