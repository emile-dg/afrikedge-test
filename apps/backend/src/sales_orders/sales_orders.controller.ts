import {RequirePermission} from '../authorization/require-permission.decorator';
import {Permission} from '../authorization/authorization.types';
import {Controller, Get, Query} from '@nestjs/common';
import {SalesOrdersServices} from "./sales_orders.services";
import type {TSalesOrderQuery} from "./sales_orders.query";
import {salesOrderQuerySchema} from "./sales_orders.query";
import {ZodValidationPipe} from "../common/pipes/zod-validation.pipe";
import {paginationQuerySchema} from "../common/schema/pagination.schema";
import type {PaginatedResponse, PaginationQuery} from "@shared/types";
import {SalesOrderStatus} from "./sales_orders.types";
import type {TSalesOrder} from "@shared/types";
import {ApiOkResponse, ApiTags} from '@nestjs/swagger';
import {ApiErrors, ApiZodQuery, paginatedResponseSchema, salesOrderResponseSchema} from '../common/swagger';

@ApiTags('Sales orders')
@ApiErrors(400, 401, 403, 500, 503)
@Controller('sales-orders')
export class SalesOrdersController {
    constructor(
        private readonly salesOrdersService: SalesOrdersServices
    ) {
    }

    @Get()
    @ApiZodQuery(salesOrderQuerySchema)
    @ApiOkResponse({standardSchema: paginatedResponseSchema(salesOrderResponseSchema)})
    @RequirePermission(Permission.SalesOrdersRead)
    async getSalesOrders(@Query(new ZodValidationPipe(salesOrderQuerySchema)) query: TSalesOrderQuery,): Promise<PaginatedResponse<TSalesOrder>> {
        return this.salesOrdersService.getSalesOrders(
            query.status !== undefined ? {status: query.status} : {},
            {page: query.page, limit: query.limit},
        );
    }

    @Get('to-plan')
    @ApiZodQuery(paginationQuerySchema)
    @ApiOkResponse({standardSchema: paginatedResponseSchema(salesOrderResponseSchema), description: 'Unplanned sales orders'})
    @RequirePermission(Permission.SalesOrdersRead)
    async getPlannedSalesOrders(@Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery): Promise<PaginatedResponse<TSalesOrder>> {
        return this.salesOrdersService.getSalesOrders(
            {status: SalesOrderStatus.Pending},
            {page: query.page, limit: query.limit},
        );
    }
}
