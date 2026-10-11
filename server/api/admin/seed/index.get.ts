export default defineEventHandler(async (event): Promise<SeedOverview> => {
    await requireDemoTools(event);
    return seedOverview();
});
