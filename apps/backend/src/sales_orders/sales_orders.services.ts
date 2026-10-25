import {Injectable, Logger} from '@nestjs/common';
import {throwDatabaseError} from '../database/database-errors';
import {SalesOrdersRepository} from "./sales_orders.repository";
import type {PaginatedResponse, PaginationQuery} from "@shared/types";
import type {TGetSalesOrdersFilters} from "./sales_orders.types";
import type {TSalesOrder} from "@shared/types";

@Injectable()
export class SalesOrdersServices {
    private readonly logger = new Logger(SalesOrdersServices.name);
    constructor(private readonly salesOrdersRepository: SalesOrdersRepository) {
    }

    async getSalesOrders(filters: TGetSalesOrdersFilters = {}, pagination: PaginationQuery = {page: 1, limit: 100}): Promise<PaginatedResponse<TSalesOrder>> {
        try {
            return await this.salesOrdersRepository.getSalesOrders(pagination.page, pagination.limit, filters.status);
        } catch (error) {
            throwDatabaseError(error, this.logger);
        }
    }
}
