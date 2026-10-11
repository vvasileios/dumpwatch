export type CollectionPointType = "mixed" | "recycling" | "glass" | "organic";

export interface NearbyPoint {
    id: string;
    type: CollectionPointType;
    fill_level: number | null;
    lat: number;
    lng: number;
    meters: number;
}

export interface NearbyResponse {
    inServiceArea: boolean;
    points: NearbyPoint[];
}

export interface Hotspot {
    id: string;
    type: CollectionPointType;
    fill_level: number | null;
    lat: number;
    lng: number;
    reports_nearby: number;
    oldest_days: number;
}
