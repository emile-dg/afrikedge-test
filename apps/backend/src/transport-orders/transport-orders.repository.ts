import {Injectable} from '@nestjs/common';
import * as sql from 'mssql';
import {DatabaseService} from '../database/database.service';
import type {PaginatedResponse, TVehicle} from '@shared/types';
import type {CreateTransportOrder, TransportOrderDetails, TransportOrderQuery, TransportOrderSummary, TransportSalesOrder} from './transport-orders.types';

const summaryColumns = `
    t.[No_] AS no, t.[Vehicle Code] AS vehicleCode,
    CONVERT(char(10), t.[Delivery Date], 23) AS deliveryDate,
    t.[Status] AS status, t.[Created By] AS createdBy, t.[Validated By] AS validatedBy
`;

@Injectable()
export class TransportOrdersRepository {
    constructor(private readonly database: DatabaseService) {
    }

    createTransaction(): sql.Transaction {
        return new sql.Transaction(this.database.getPool());
    }

    async lockMutations(transaction: sql.Transaction): Promise<boolean> {
        const result = await transaction.request()
            .input('resource', sql.NVarChar(255), 'AfrikEdge.TransportOrders.Mutations')
            .input('timeout', sql.Int, 10_000)
            .query<{result: number}>(`
                DECLARE @result int;
                EXEC @result = sys.sp_getapplock @Resource = @resource,
                    @LockMode = 'Exclusive', @LockOwner = 'Transaction', @LockTimeout = @timeout;
                SELECT @result AS result;
            `);
        return result.recordset[0].result >= 0;
    }

    async findAll(query: TransportOrderQuery): Promise<PaginatedResponse<TransportOrderSummary>> {
        const request = this.database.getPool().request()
            .input('status', sql.TinyInt, query.status ?? null)
            .input('date', sql.Date, query.date ?? null)
            .input('offset', sql.Int, (query.page - 1) * query.limit)
            .input('limit', sql.Int, query.limit);

        const result = await request.query<[{total: number}, TransportOrderSummary]>(`
            SELECT COUNT(*) AS total FROM [Transport Order] t
            WHERE (@status IS NULL OR t.[Status] = @status)
                AND (@date IS NULL OR t.[Delivery Date] = @date);
            SELECT ${summaryColumns}, COALESCE(w.totalWeightKg, 0) AS totalWeightKg
            FROM [Transport Order] t
            OUTER APPLY (
                SELECT SUM(s.[Total Weight (kg)]) AS totalWeightKg
                FROM [Transport Order Line] l
                JOIN [Sales Order] s ON s.[No_] = l.[Sales Order No_]
                WHERE l.[Transport Order No_] = t.[No_]
            ) w
            WHERE (@status IS NULL OR t.[Status] = @status)
                AND (@date IS NULL OR t.[Delivery Date] = @date)
            ORDER BY t.[No_]
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
        `);
        const sets = result.recordsets;
        const total = sets[0][0].total;
        return {data: sets[1], total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit)};
    }

    async findOne(no: string, transaction?: sql.Transaction): Promise<TransportOrderDetails | undefined> {
        const context = transaction ?? this.database.getPool();
        const hint = transaction ? 'WITH (UPDLOCK, HOLDLOCK)' : '';
        const header = await context.request().input('no', sql.NVarChar(20), no)
            .query<Omit<TransportOrderDetails, 'salesOrders'>>(`
                SELECT ${summaryColumns}, v.[Plate No_] AS plateNo, v.[Capacity (kg)] AS capacityKg,
                    COALESCE(w.totalWeightKg, 0) AS totalWeightKg,
                    v.[Capacity (kg)] - COALESCE(w.totalWeightKg, 0) AS remainingCapacityKg
                FROM [Transport Order] t ${hint}
                LEFT JOIN [Vehicle] v ${hint} ON v.[Code] = t.[Vehicle Code]
                OUTER APPLY (
                    SELECT SUM(s.[Total Weight (kg)]) AS totalWeightKg
                    FROM [Transport Order Line] l ${hint}
                    JOIN [Sales Order] s ${hint} ON s.[No_] = l.[Sales Order No_]
                    WHERE l.[Transport Order No_] = t.[No_]
                ) w
                WHERE t.[No_] = @no;
            `);
        const transport = header.recordset[0];
        if (!transport) return undefined;
        const lines = await context.request().input('no', sql.NVarChar(20), no)
            .query<TransportSalesOrder>(`
                SELECT s.[No_] AS no, s.[Customer No_] AS customerNo,
                    s.[Customer Name] AS customerName, s.[Delivery City] AS deliveryCity,
                    s.[Total Weight (kg)] AS totalWeightKg, s.[Status] AS status
                FROM [Transport Order Line] l ${hint}
                JOIN [Sales Order] s ${hint} ON s.[No_] = l.[Sales Order No_]
                WHERE l.[Transport Order No_] = @no
                ORDER BY s.[No_];
            `);
        return {
            ...transport,
            salesOrders: lines.recordset,
        };
    }

    async findVehicle(code: string, transaction: sql.Transaction): Promise<TVehicle | undefined> {
        const result = await transaction.request().input('code', sql.NVarChar(20), code).query<TVehicle>(`
            SELECT [Code] AS code, [Plate No_] AS plateNo, [Capacity (kg)] AS capacityKg, [Active] AS active
            FROM [Vehicle] WITH (UPDLOCK, HOLDLOCK) WHERE [Code] = @code;
        `);
        return result.recordset[0];
    }

    async isScheduled(input: CreateTransportOrder, transaction: sql.Transaction): Promise<boolean> {
        const result = await transaction.request()
            .input('code', sql.NVarChar(20), input.vehicleCode)
            .input('date', sql.Date, input.deliveryDate)
            .query<{no: string}>(`
                SELECT [No_] AS no FROM [Transport Order] WITH (UPDLOCK, HOLDLOCK)
                WHERE [Vehicle Code] = @code AND [Delivery Date] = @date;
            `);
        return result.recordset.length > 0;
    }

    async nextNumber(transaction: sql.Transaction): Promise<string> {
        const result = await transaction.request().query<{suffix: string}>(`
            SELECT CONVERT(varchar(20), COALESCE(MAX(TRY_CONVERT(decimal(17, 0), SUBSTRING([No_], 4, 17))), 0) + 1) AS suffix
            FROM [Transport Order] WITH (UPDLOCK, HOLDLOCK)
            WHERE LEFT([No_], 3) = N'TO-'
                AND SUBSTRING([No_], 4, 20) NOT LIKE N'%[^0-9]%'
                AND LEN([No_]) > 3;
        `);
        return 'TO-' + result.recordset[0].suffix.padStart(4, '0');
    }

    async insert(no: string, input: CreateTransportOrder, userId: string, transaction: sql.Transaction): Promise<void> {
        await transaction.request()
            .input('no', sql.NVarChar(20), no)
            .input('code', sql.NVarChar(20), input.vehicleCode)
            .input('date', sql.Date, input.deliveryDate)
            .input('userId', sql.NVarChar(50), userId)
            .query(`
                INSERT INTO [Transport Order] ([No_], [Vehicle Code], [Delivery Date], [Status], [Created By], [Validated By])
                VALUES (@no, @code, @date, 0, @userId, NULL);
            `);
    }

    async findSalesOrder(no: string, transaction: sql.Transaction): Promise<(TransportSalesOrder & {assigned: boolean}) | undefined> {
        const result = await transaction.request().input('no', sql.NVarChar(20), no)
            .query<TransportSalesOrder & {assigned: boolean}>(`
                SELECT s.[No_] AS no, s.[Customer No_] AS customerNo,
                    s.[Customer Name] AS customerName, s.[Delivery City] AS deliveryCity,
                    s.[Total Weight (kg)] AS totalWeightKg, s.[Status] AS status,
                    CAST(CASE WHEN EXISTS (
                        SELECT 1 FROM [Transport Order Line] WITH (UPDLOCK, HOLDLOCK)
                        WHERE [Sales Order No_] = @no
                    ) THEN 1 ELSE 0 END AS bit) AS assigned
                FROM [Sales Order] s WITH (UPDLOCK, HOLDLOCK) WHERE s.[No_] = @no;
            `);
        return result.recordset[0];
    }

    async addLine(no: string, salesOrderNo: string, transaction: sql.Transaction): Promise<void> {
        await transaction.request().input('no', sql.NVarChar(20), no)
            .input('salesOrderNo', sql.NVarChar(20), salesOrderNo).query(`
                INSERT INTO [Transport Order Line] ([Transport Order No_], [Sales Order No_])
                VALUES (@no, @salesOrderNo);
                UPDATE [Sales Order] SET [Status] = 1 WHERE [No_] = @salesOrderNo;
            `);
    }

    async removeLine(no: string, salesOrderNo: string, transaction: sql.Transaction): Promise<void> {
        await transaction.request().input('no', sql.NVarChar(20), no)
            .input('salesOrderNo', sql.NVarChar(20), salesOrderNo).query(`
                DELETE FROM [Transport Order Line]
                WHERE [Transport Order No_] = @no AND [Sales Order No_] = @salesOrderNo;
                UPDATE [Sales Order] SET [Status] = 0 WHERE [No_] = @salesOrderNo;
            `);
    }

    async validate(no: string, userId: string, transaction: sql.Transaction): Promise<void> {
        await transaction.request().input('no', sql.NVarChar(20), no)
            .input('userId', sql.NVarChar(50), userId).query(`
                UPDATE [Transport Order] SET [Status] = 1, [Validated By] = @userId WHERE [No_] = @no;
            `);
    }

    async depart(no: string, transaction: sql.Transaction): Promise<void> {
        await transaction.request().input('no', sql.NVarChar(20), no).query(`
            UPDATE [Transport Order] SET [Status] = 2 WHERE [No_] = @no;
            UPDATE s SET s.[Status] = 2 FROM [Sales Order] s
            JOIN [Transport Order Line] l ON l.[Sales Order No_] = s.[No_]
            WHERE l.[Transport Order No_] = @no;
        `);
    }
}
