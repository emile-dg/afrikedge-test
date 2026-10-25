import {ConflictException, HttpException, InternalServerErrorException, ServiceUnavailableException} from '@nestjs/common';
import type {Logger} from '@nestjs/common';
import * as sql from 'mssql';

export function throwDatabaseError(error: unknown, logger: Pick<Logger, 'error'>): never {
    if (error instanceof HttpException) throw error;
    logger.error('Database operation failed', error instanceof Error ? error.stack : undefined);
    if (error instanceof sql.RequestError) {
        if (error.number === 1205 || error.number === 1222) {
            throw new ConflictException('Concurrent transport modification; retry the request');
        }
        if (error.number === 2601 || error.number === 2627) {
            throw new ConflictException('The requested operation conflicts with an existing record');
        }
        if (error.code === 'ETIMEOUT' || error.code === 'ESOCKET' || error.code === 'ECONNCLOSED') {
            throw new ServiceUnavailableException('Database unavailable; retry the request');
        }
    }
    if (error instanceof sql.ConnectionError) {
        throw new ServiceUnavailableException('Database unavailable; retry the request');
    }
    throw new InternalServerErrorException('Unable to complete database operation');
}
