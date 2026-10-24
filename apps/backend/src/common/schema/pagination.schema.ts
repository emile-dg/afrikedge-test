import {z} from "zod";
import type {PaginationQuery} from "@shared/types";

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).default(100),
}) satisfies z.ZodType<PaginationQuery>;
