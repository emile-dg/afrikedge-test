import {Injectable, Logger, OnModuleDestroy, OnModuleInit, ServiceUnavailableException} from '@nestjs/common';
import * as sql from 'mssql';
import {ConfigService} from "@nestjs/config";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(DatabaseService.name);
    private pool?: sql.ConnectionPool;

    constructor(private readonly config: ConfigService) {
    }

    async onModuleInit(): Promise<void> {
        const settings: sql.config = {
            server: this.config.getOrThrow<string>('DB_HOST'),
            port: this.config.getOrThrow<number>('DB_PORT'),
            user: this.config.getOrThrow<string>('DB_USER'),
            password: this.config.getOrThrow<string>('DB_PASSWORD'),
            database: this.config.getOrThrow<string>('DB_NAME'),
            connectionTimeout: 15_000,
            requestTimeout: 15_000,
            pool: {min: 0, max: 10, idleTimeoutMillis: 30_000},
            options: {
                encrypt: this.config.getOrThrow<string>('DB_ENCRYPT') === 'true',
                trustServerCertificate: this.config.getOrThrow<string>('DB_TRUST_SERVER_CERTIFICATE') === 'true',
            },
        };
        this.pool = new sql.ConnectionPool(settings);
        try {
            await this.pool.connect();
            this.logger.log('SQL Server pool connected');
        } catch (error) {
            this.logger.error('SQL Server connection failed', error instanceof Error ? error.stack : undefined);
            await this.pool.close().catch(() => undefined);
            throw error;
        }
    }

    getPool(): sql.ConnectionPool {
        if (!this.pool?.connected) throw new ServiceUnavailableException('Database unavailable');
        return this.pool;
    }

    async onModuleDestroy(): Promise<void> {
        if (this.pool) await this.pool.close();
    }
}
