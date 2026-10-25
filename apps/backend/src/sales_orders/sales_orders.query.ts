import {z} from "zod";
import {paginationQuerySchema} from "../common/schema/pagination.schema";

export const salesOrderQuerySchema = paginationQuerySchema.safeExtend({
    status: z.enum(['0', '1', '2']).transform(Number).optional(),
});

export type TSalesOrderQuery = z.infer<typeof salesOrderQuerySchema>;
