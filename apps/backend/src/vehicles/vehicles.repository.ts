import {Injectable, Logger, ServiceUnavailableException} from '@nestjs/common';
import * as sql from 'mssql';
import {DatabaseService} from '../database/database.service';
import type {TVehicle} from "@shared/types";

@Injectable()
export class VehiclesRepository {
    private readonly logger = new Logger(VehiclesRepository.name);

    constructor(private readonly database: DatabaseService) {
    }

    async findAllActive(): Promise<TVehicle[]> {
        const request = this.database.getPool().request();
        request.input('active', sql.Bit, true);
        try {
            const {recordset} = await request.query<TVehicle[]>(`
                SELECT [Code] AS code, [Plate No_] AS plateNo, [Capacity (kg)] AS capacityKg, [Active] AS active
                FROM "Vehicle"
                WHERE [Active] = @active
                ORDER BY [Code];
            `);
            return recordset;
        } catch (error) {
            this.logger.error('Vehicle query failed', error instanceof Error ? error.stack : undefined);
            throw new ServiceUnavailableException('Unable to load vehicles');
        }
    }
}
