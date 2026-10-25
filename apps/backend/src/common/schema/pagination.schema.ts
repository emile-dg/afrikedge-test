import {z} from 'zod';
import type {PaginationQuery} from '@shared/types';

const positiveIntegerQuery = z.union([z.string().regex(/^[0-9]+$/), z.number()]).pipe(
    z.coerce.number<string | number>().int().min(1).max(2147483647),
);

export const paginationQuerySchema = z.object({
    page: positiveIntegerQuery.default(1),
    limit: positiveIntegerQuery.pipe(z.number().max(100)).default(100),
}).refine(({page, limit}) => (page - 1) * limit <= 2147483647,
    'Pagination exceeds the supported SQL Server range') satisfies z.ZodType<PaginationQuery>;
