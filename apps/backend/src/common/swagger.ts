import {applyDecorators} from '@nestjs/common';
import {ApiBody, ApiQuery, ApiResponse} from '@nestjs/swagger';
import type {SchemaObject} from '@nestjs/swagger';
import {z} from 'zod';
import type {PaginatedResponse, TSalesOrder, TVehicle} from '@shared/types';
import type {TransportOrderDetails, TransportOrderSummary} from '../transport-orders/transport-orders.types';

function requestSchema(schema: z.ZodType): SchemaObject {
    return z.toJSONSchema(schema, {io: 'input', target: 'openapi-3.0'}) as SchemaObject;
}

export function ApiZodBody(schema: z.ZodType) {
    return ApiBody({schema: requestSchema(schema)});
}

export function ApiZodQuery(schema: z.ZodType) {
    const json = requestSchema(schema);
    return applyDecorators(...Object.entries(json.properties ?? {}).map(([name, property]) =>
        ApiQuery({name, required: json.required?.includes(name) ?? false, schema: property})));
}

export function ApiErrors(...statuses: number[]) {
    const descriptions: Record<number, string> = {
        400: 'Invalid request parameters', 401: 'Missing or unrecognized user identity',
        403: 'Insufficient permission', 404: 'Record or assignment not found',
        409: 'Capacity, assignment, scheduling, or status conflict',
        500: 'Unexpected server error', 503: 'Database unavailable or request timed out',
    };
    return applyDecorators(...statuses.map((status) => ApiResponse({status, description: descriptions[status]})));
}

export const salesOrderResponseSchema = z.object({
    no: z.string(), customerNo: z.string(), customerName: z.string(), deliveryCity: z.string(),
    totalWeightKg: z.number(), status: z.literal([0, 1, 2]).describe('0: Unplanned, 1: Planned, 2: Ongoing'),
}) satisfies z.ZodType<TSalesOrder>;

export const vehicleResponseSchema = z.object({
    code: z.string(), plateNo: z.string(), capacityKg: z.number(), active: z.boolean(),
}) satisfies z.ZodType<TVehicle>;

export const transportSummaryResponseSchema = z.object({
    no: z.string(), vehicleCode: z.string(), deliveryDate: z.iso.date(),
    status: z.literal([0, 1, 2]).describe('0: Draft, 1: Validated, 2: Departed'),
    createdBy: z.string(), validatedBy: z.string().nullable(), totalWeightKg: z.number(),
}) satisfies z.ZodType<TransportOrderSummary>;

export const transportDetailsResponseSchema = transportSummaryResponseSchema.extend({
    plateNo: z.string(), capacityKg: z.number(), remainingCapacityKg: z.number(),
    salesOrders: z.array(salesOrderResponseSchema),
}) satisfies z.ZodType<TransportOrderDetails>;

export function paginatedResponseSchema<T extends z.ZodType>(item: T) {
    return z.object({
        data: z.array(item), total: z.number().int().min(0), page: z.number().int().min(1),
        limit: z.number().int().min(1).max(100), totalPages: z.number().int().min(0),
    }) satisfies z.ZodType<PaginatedResponse<z.output<T>>>;
}
