import type { SEED_ENTITIES } from "../utils/seed";

export type SeedEntity = (typeof SEED_ENTITIES)[number];

export interface SeedStatus {
    entity: SeedEntity;
    sample: number;
    yours: number | null;
    canSeed: boolean;
    canRemove: boolean;
    reason: string | null;
    warning: string | null;
}

export interface SeedOverview {
    entities: SeedStatus[];
    demoUsers: { email: string; role: string }[];
    demoPassword: string;
}
