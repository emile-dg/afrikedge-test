import {Injectable} from '@nestjs/common';
import * as sql from 'mssql';
import {DatabaseService} from "../database/database.service";
import {SalesOrderStatus} from "./sales_orders.types";
import {PaginatedResponse, TSalesOrder} from "@shared/types";

@Injectable()
export class SalesOrdersRepository {

    constructor(private readonly database: DatabaseService) {
    }


    async getSalesOrders(page: number = 1, perPage: number = 10, status?: SalesOrderStatus): Promise<PaginatedResponse<TSalesOrder>> {
        const offset = page >= 1 ? (page - 1) * perPage : 0;

        const request = this.database.getPool().request();
        request.input('status', sql.TinyInt, status ?? null);
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, perPage);

        const {recordsets} = await request.query<[{total: number}, TSalesOrder]>(`
            SELECT COUNT(*) AS total
            FROM [Sales Order]
            WHERE (@status IS NULL OR [Status] = @status);

            SELECT [No_] as no, [Customer No_] as customer_no, [Customer Name] as Customer_name, [Delivery City] as delivery_city, [Total Weight (Kg)] as total_weight_kg, [Status] as status
            FROM "Sales Order"
            WHERE (@status IS NULL OR [Status] = @status)
            ORDER BY [No_]
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);
        const total = recordsets[0][0].total;
        return {
            data: recordsets[1],
            total,
            page,
            limit: perPage,
            totalPages: Math.ceil(total / perPage),
        };
    }
}
