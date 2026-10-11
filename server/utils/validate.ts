import { z } from "zod";

export function parseInput<T extends z.ZodType>(
    schema: T,
    input: unknown,
): z.output<T> {
    const result = schema.safeParse(input);
    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid input",
            data: z.flattenError(result.error).fieldErrors,
        });
    }
    return result.data;
}
