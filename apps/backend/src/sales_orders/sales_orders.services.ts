import {Injectable} from '@nestjs/common';
import {SalesOrdersRepository} from "./sales_orders.repository";
import {PaginationQuery} from "@shared/types";
import {TGetSalesOrdersFilters} from "./sales_orders.types";
import {TSalesOrder} from "@shared/types";

@Injectable()
export class SalesOrdersServices {
    constructor(private readonly salesOrdersRepository: SalesOrdersRepository) {
    }

    async getSalesOrders(filters: TGetSalesOrdersFilters = {}, pagination: PaginationQuery = {page: 1, limit: 100}): Promise<TSalesOrder[]> {
        return this.salesOrdersRepository.getSalesOrders(pagination.page, pagination.limit, filters.status);
    }
}
