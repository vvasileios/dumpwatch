import { z } from "zod";

export default defineEventHandler(async (event): Promise<SeedOverview> => {
    await requireDemoTools(event);
    const { entity } = parseInput(
        z.object({ entity: z.enum(SEED_ENTITIES) }),
        getRouterParams(event),
    );
    await seedEntity(entity);
    return seedOverview();
});
