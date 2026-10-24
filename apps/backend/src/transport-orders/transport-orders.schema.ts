import {z} from 'zod';
import {paginationQuerySchema} from '../common/schema/pagination.schema';

export const transportIdentifierSchema = z.string().trim().min(1).max(20);
export const transportUserSchema = z.string().trim().min(1).max(50);
const dateSchema = z.iso.date().refine((value) => {
    const parsed = new Date(value + 'T00:00:00.000Z');
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value && value >= '0001-01-01';
}, 'Expected a valid calendar date in YYYY-MM-DD format');

export const transportOrderQuerySchema = paginationQuerySchema.extend({
    status: z.enum(['0', '1', '2']).transform(Number).optional(),
    date: dateSchema.optional(),
}).refine(({page, limit}) => limit <= 2147483647 && (page - 1) * limit <= 2147483647,
    'Pagination exceeds the supported SQL Server range');

export const createTransportOrderSchema = z.strictObject({
    vehicleCode: transportIdentifierSchema,
    deliveryDate: dateSchema,
});

export const addTransportLinesSchema = z.strictObject({
    salesOrderNos: z.array(transportIdentifierSchema).min(1).refine(
        (values) => new Set(values).size === values.length,
        'Duplicate sales order numbers are not allowed',
    ),
});

export type AddTransportLines = z.infer<typeof addTransportLinesSchema>;
