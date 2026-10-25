import {BadRequestException, ConflictException, Injectable, Logger, NotFoundException} from '@nestjs/common';
import {throwDatabaseError} from '../database/database-errors';
import * as sql from 'mssql';
import {TransportOrdersRepository} from './transport-orders.repository';
import {TransportOrderStatus} from './transport-orders.types';
import type {CreateTransportOrder, TransportOrderDetails, TransportOrderQuery} from './transport-orders.types';
import {SalesOrderStatus} from '../sales_orders/sales_orders.types';

@Injectable()
export class TransportOrdersService {
    private readonly logger = new Logger(TransportOrdersService.name);
    constructor(private readonly repository: TransportOrdersRepository) {
    }

    async findAll(query: TransportOrderQuery) {
        try {
            return await this.repository.findAll(query);
        } catch (error) {
            throwDatabaseError(error, this.logger);
        }
    }

    async findOne(no: string, transaction?: sql.Transaction): Promise<TransportOrderDetails> {
        if (!transaction) return this.withTransportTransaction((context) => this.findOne(no, context));
        const transport = await this.repository.findOne(no, transaction);
        if (!transport) throw new NotFoundException('Transport order ' + no + ' does not exist');
        return transport;
    }

    private requireStatus(transport: TransportOrderDetails, status: TransportOrderStatus): void {
        if (transport.status !== status) {
            throw new ConflictException('Transport order ' + transport.no + ' must be ' + TransportOrderStatus[status]);
        }
    }

    private async withTransportTransaction<T>(operation: (transaction: sql.Transaction) => Promise<T>): Promise<T> {
        let transaction: sql.Transaction | undefined;
        let started = false;
        let rolledBack = false;
        try {
            transaction = this.repository.createTransaction();
            transaction.on('rollback', () => { rolledBack = true; });
            await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
            started = true;
            if (!await this.repository.lockMutations(transaction)) {
                throw new ConflictException('Transport orders are being modified; retry the request');
            }
            const result = await operation(transaction);
            await transaction.commit();
            return result;
        } catch (error) {
            if (transaction && started && !rolledBack) {
                try {
                    await transaction.rollback();
                } catch (rollbackError) {
                    this.logger.error('Transport transaction rollback failed',
                        rollbackError instanceof Error ? rollbackError.stack : undefined);
                }
            }
            throwDatabaseError(error, this.logger);
        }
    }

    create(input: CreateTransportOrder, userId: string): Promise<TransportOrderDetails> {
        return this.withTransportTransaction(async (transaction) => {
            const parts = new Intl.DateTimeFormat('en-US', {
                timeZone: 'Africa/Douala', year: 'numeric', month: '2-digit', day: '2-digit',
            }).formatToParts(new Date());
            const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((value) => value.type === type)!.value;
            const today = part('year') + '-' + part('month') + '-' + part('day');
            if (input.deliveryDate < today) throw new BadRequestException('Delivery date cannot be in the past');
            const vehicle = await this.repository.findVehicle(input.vehicleCode, transaction);
            if (!vehicle) throw new NotFoundException('Vehicle ' + input.vehicleCode + ' does not exist');
            if (!vehicle.active) throw new ConflictException('Vehicle ' + input.vehicleCode + ' is inactive');
            if (await this.repository.isScheduled(input, transaction)) {
                throw new ConflictException('Vehicle ' + input.vehicleCode + ' is already scheduled for ' + input.deliveryDate);
            }
            const no = await this.repository.nextNumber(transaction);
            if (no.length > 20) throw new ConflictException('Transport order numbering is exhausted');
            await this.repository.insert(no, input, userId, transaction);
            return this.findOne(no, transaction);
        });
    }

    addLines(no: string, salesOrderNos: string[]): Promise<TransportOrderDetails> {
        if (salesOrderNos.length === 0 || new Set(salesOrderNos).size !== salesOrderNos.length) {
            throw new BadRequestException('Supply at least one sales order without duplicate numbers');
        }
        return this.withTransportTransaction(async (transaction) => {
            const transport = await this.findOne(no, transaction);
            this.requireStatus(transport, TransportOrderStatus.Draft);
            let weight = Math.round(transport.totalWeightKg * 100);
            const orders: string[] = [];
            for (const salesOrderNo of [...salesOrderNos].sort()) {
                const order = await this.repository.findSalesOrder(salesOrderNo, transaction);
                if (!order) throw new NotFoundException('Sales order ' + salesOrderNo + ' does not exist');
                if (order.assigned || order.status !== SalesOrderStatus.Pending) {
                    throw new ConflictException('Sales order ' + order.no + ' must be unplanned and unassigned');
                }
                if (orders.includes(order.no)) throw new BadRequestException('Duplicate sales order numbers are not allowed');
                orders.push(order.no);
                weight += Math.round(order.totalWeightKg * 100);
            }
            if (weight > Math.round(transport.capacityKg * 100)) {
                throw new ConflictException('Assigned weight would exceed vehicle capacity for transport order ' + no);
            }
            for (const order of orders) await this.repository.addLine(no, order, transaction);
            return this.findOne(no, transaction);
        });
    }

    removeLine(no: string, salesOrderNo: string): Promise<void> {
        return this.withTransportTransaction(async (transaction) => {
            const transport = await this.findOne(no, transaction);
            this.requireStatus(transport, TransportOrderStatus.Draft);
            const order = await this.repository.findSalesOrder(salesOrderNo, transaction);
            if (!order || !transport.salesOrders.some((line) => line.no === order.no)) {
                throw new NotFoundException('Sales order ' + salesOrderNo + ' does not belong to transport order ' + no);
            }
            await this.repository.removeLine(no, order.no, transaction);
        });
    }

    validate(no: string, userId: string): Promise<TransportOrderDetails> {
        return this.withTransportTransaction(async (transaction) => {
            const transport = await this.findOne(no, transaction);
            this.requireStatus(transport, TransportOrderStatus.Draft);
            if (transport.salesOrders.length === 0) {
                throw new ConflictException('Transport order ' + no + ' must contain at least one sales order before validation');
            }
            await this.repository.validate(no, userId, transaction);
            return this.findOne(no, transaction);
        });
    }

    depart(no: string): Promise<TransportOrderDetails> {
        return this.withTransportTransaction(async (transaction) => {
            const transport = await this.findOne(no, transaction);
            this.requireStatus(transport, TransportOrderStatus.Validated);
            await this.repository.depart(no, transaction);
            return this.findOne(no, transaction);
        });
    }
}
