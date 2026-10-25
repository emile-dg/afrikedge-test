import {EventEmitter} from 'node:events';
import {BadRequestException, ConflictException, NotFoundException} from '@nestjs/common';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {TransportOrdersService} from './transport-orders.service';
import type {TransportOrdersRepository} from './transport-orders.repository';
import type {TransportOrderDetails, TransportSalesOrder} from './transport-orders.types';
import {TransportOrderStatus} from './transport-orders.types';
import {SalesOrderStatus} from '../sales_orders/sales_orders.types';

function order(no = 'SO-1', totalWeightKg = 100) {
    return {
        no, totalWeightKg, customerNo: 'C-1', customerName: 'Client', deliveryCity: 'Douala',
        status: SalesOrderStatus.Pending, assigned: false,
    };
}

function details(overrides: Partial<TransportOrderDetails> = {}): TransportOrderDetails {
    return {
        no: 'TO-1', vehicleCode: 'VH-1', plateNo: 'LT-123', deliveryDate: '2026-10-25',
        status: TransportOrderStatus.Draft, createdBy: 'diane', validatedBy: null,
        capacityKg: 1500, totalWeightKg: 0, remainingCapacityKg: 1500, salesOrders: [], ...overrides,
    };
}

function setup() {
    const transaction = Object.assign(new EventEmitter(), {
        begin: vi.fn().mockResolvedValue(undefined),
        commit: vi.fn().mockResolvedValue(undefined),
        rollback: vi.fn().mockResolvedValue(undefined),
    });
    const repository = {
        createTransaction: vi.fn(() => transaction),
        lockMutations: vi.fn().mockResolvedValue(true),
        findOne: vi.fn<TransportOrdersRepository['findOne']>().mockResolvedValue(details()),
        findSalesOrder: vi.fn<TransportOrdersRepository['findSalesOrder']>()
            .mockImplementation(async (no) => order(no)),
        addLine: vi.fn().mockResolvedValue(undefined),
        removeLine: vi.fn().mockResolvedValue(undefined),
        validate: vi.fn().mockResolvedValue(undefined),
        depart: vi.fn().mockResolvedValue(undefined),
    };
    const service = new TransportOrdersService(repository as unknown as TransportOrdersRepository);
    const expectNoWrites = () => {
        for (const write of [repository.addLine, repository.removeLine, repository.validate, repository.depart]) {
            expect(write).not.toHaveBeenCalled();
        }
        expect(transaction.commit).not.toHaveBeenCalled();
    };
    return {service, repository, transaction, expectNoWrites};
}

describe('Transport capacity rules', () => {
    let context: ReturnType<typeof setup>;
    beforeEach(() => {
        context = setup();
    });

    it.each([
        {label: 'below capacity', existing: 1000, weights: [100, 200], capacity: 1500},
        {label: 'exact capacity with existing assignments', existing: 1360, weights: [95.25, 44.75], capacity: 1500},
        {label: 'fractional arithmetic', existing: 0.1, weights: [0.2], capacity: 0.3},
    ])('accepts $label', async ({existing, weights, capacity}) => {
        const {service, repository, transaction} = context;
        const orders = weights.map((weight, i) => order('SO-' + i, weight));
        const total = Math.round((existing + weights.reduce((sum, weight) => sum + weight, 0)) * 100) / 100;
        const updated = details({
            capacityKg: capacity, totalWeightKg: total,
            remainingCapacityKg: capacity - total, salesOrders: orders
        });
        repository.findOne.mockResolvedValueOnce(details({totalWeightKg: existing, capacityKg: capacity}))
            .mockResolvedValueOnce(updated);
        repository.findSalesOrder.mockImplementation(async (no) => orders.find((item) => item.no === no));

        await expect(service.addLines('TO-1', orders.map((item) => item.no))).resolves.toEqual(updated);

        expect(repository.addLine).toHaveBeenCalledTimes(orders.length);
        for (const item of orders) expect(repository.addLine).toHaveBeenCalledWith('TO-1', item.no, transaction);
        expect(transaction.commit).toHaveBeenCalledOnce();
    });

    it.each([
        {existing: 1000, weights: [300, 300]},
        {existing: 1360, weights: [95.25, 44.76]},
    ])('rejects overflow with existing $existing kg and incoming $weights', async ({existing, weights}) => {
        const {service, repository, expectNoWrites} = context;
        repository.findOne.mockResolvedValue(details({totalWeightKg: existing}));
        repository.findSalesOrder.mockImplementation(async (no) => order(no, weights[Number(no.slice(-1))]));

        await expect(service.addLines('TO-1', ['SO-0', 'SO-1'])).rejects.toBeInstanceOf(ConflictException);

        expectNoWrites();
    });
});

describe('Transport assignment rules', () => {
    let context: ReturnType<typeof setup>;
    beforeEach(() => {
        context = setup();
    });

    it.each([['SO-1'], ['SO-2', 'SO-1']])('assigns the valid selection %j', async (...nos) => {
        const {service, repository, transaction} = context;
        const selected = nos as string[];
        const updated = details({salesOrders: selected.map((no) => order(no)), totalWeightKg: selected.length * 100});
        repository.findOne.mockResolvedValueOnce(details()).mockResolvedValueOnce(updated);

        await expect(service.addLines('TO-1', selected)).resolves.toEqual(updated);

        expect(repository.addLine.mock.calls).toEqual([...selected].sort().map((no) => ['TO-1', no, transaction]));
        expect(transaction.commit).toHaveBeenCalledOnce();
    });

    it.each([{nos: []}, {nos: ['SO-1', 'SO-1']}])('rejects empty or duplicate selection $nos', ({nos}) => {
        expect(() => context.service.addLines('TO-1', nos)).toThrow(BadRequestException);
        context.expectNoWrites();
    });

    it('rejects identifiers resolving to the same canonical order', async () => {
        context.repository.findSalesOrder.mockResolvedValue(order('SO-1'));
        await expect(context.service.addLines('TO-1', ['SO-1', 'so-1'])).rejects.toBeInstanceOf(BadRequestException);
        context.expectNoWrites();
    });

    it.each([
        {label: 'missing', invalid: undefined, exception: NotFoundException},
        {label: 'planned', invalid: {...order('SO-2'), status: SalesOrderStatus.Planned}, exception: ConflictException},
        {label: 'ongoing', invalid: {...order('SO-2'), status: SalesOrderStatus.Ongoing}, exception: ConflictException},
        {
            label: 'already assigned but unplanned',
            invalid: {...order('SO-2'), assigned: true},
            exception: ConflictException
        },
    ])('rejects the whole batch when a later order is $label', async ({invalid, exception}) => {
        context.repository.findSalesOrder.mockResolvedValueOnce(order()).mockResolvedValueOnce(invalid);
        await expect(context.service.addLines('TO-1', ['SO-1', 'SO-2'])).rejects.toBeInstanceOf(exception);
        context.expectNoWrites();
    });

    it.each([TransportOrderStatus.Validated, TransportOrderStatus.Departed])('rejects addition and removal in status %s', async (status) => {
        context.repository.findOne.mockResolvedValue(details({status, salesOrders: [order()]}));
        await expect(context.service.addLines('TO-1', ['SO-2'])).rejects.toBeInstanceOf(ConflictException);
        await expect(context.service.removeLine('TO-1', 'SO-1')).rejects.toBeInstanceOf(ConflictException);
        context.expectNoWrites();
    });

    it('removes a member from a Draft using its canonical identifier', async () => {
        const {service, repository, transaction} = context;
        repository.findOne.mockResolvedValue(details({salesOrders: [order()]}));
        repository.findSalesOrder.mockResolvedValue(order());
        await expect(service.removeLine('TO-1', 'so-1')).resolves.toBeUndefined();
        expect(repository.removeLine).toHaveBeenCalledWith('TO-1', 'SO-1', transaction);
        expect(transaction.commit).toHaveBeenCalledOnce();
    });

    it.each([undefined, order('SO-2')])('rejects removal of a missing order or nonmember %j', async (salesOrder) => {
        context.repository.findOne.mockResolvedValue(details({salesOrders: [order()]}));
        context.repository.findSalesOrder.mockResolvedValue(salesOrder);
        await expect(context.service.removeLine('TO-1', 'SO-2')).rejects.toBeInstanceOf(NotFoundException);
        context.expectNoWrites();
    });

    it('rolls back without committing when a later batch write fails', async () => {
        const {service, repository, transaction} = context;
        const failure = new ConflictException('Assignment failed');
        repository.addLine.mockResolvedValueOnce(undefined).mockRejectedValueOnce(failure);
        await expect(service.addLines('TO-1', ['SO-1', 'SO-2'])).rejects.toBe(failure);
        expect(repository.addLine).toHaveBeenNthCalledWith(1, 'TO-1', 'SO-1', transaction);
        expect(repository.addLine).toHaveBeenNthCalledWith(2, 'TO-1', 'SO-2', transaction);
        expect(transaction.rollback).toHaveBeenCalledOnce();
        expect(transaction.commit).not.toHaveBeenCalled();
    });
});

describe('Transport status rules', () => {
    let context: ReturnType<typeof setup>;
    beforeEach(() => {
        context = setup();
    });

    it('validates a nonempty Draft and returns updated details with the supplied validator', async () => {
        const {service, repository, transaction} = context;
        const salesOrders: TransportSalesOrder[] = [{...order(), status: SalesOrderStatus.Planned}];
        const updated = details({status: TransportOrderStatus.Validated, validatedBy: 'eric', salesOrders});
        repository.findOne.mockResolvedValueOnce(details({salesOrders})).mockResolvedValueOnce(updated);
        await expect(service.validate('TO-1', 'eric')).resolves.toEqual(updated);
        expect(repository.validate).toHaveBeenCalledExactlyOnceWith('TO-1', 'eric', transaction);
        expect(transaction.commit).toHaveBeenCalledOnce();
    });

    it('rejects validation of an empty Draft', async () => {
        await expect(context.service.validate('TO-1', 'eric')).rejects.toBeInstanceOf(ConflictException);
        context.expectNoWrites();
    });

    it.each([TransportOrderStatus.Validated, TransportOrderStatus.Departed])('rejects repeat validation in status %s', async (status) => {
        context.repository.findOne.mockResolvedValue(details({status, salesOrders: [order()]}));
        await expect(context.service.validate('TO-1', 'eric')).rejects.toBeInstanceOf(ConflictException);
        context.expectNoWrites();
    });

    it('departs a Validated transport and returns updated details', async () => {
        const {service, repository, transaction} = context;
        const updated = details({
            status: TransportOrderStatus.Departed,
            salesOrders: [{...order(), status: SalesOrderStatus.Ongoing}]
        });
        repository.findOne.mockResolvedValueOnce(details({status: TransportOrderStatus.Validated}))
            .mockResolvedValueOnce(updated);
        await expect(service.depart('TO-1')).resolves.toEqual(updated);
        expect(repository.depart).toHaveBeenCalledExactlyOnceWith('TO-1', transaction);
        expect(transaction.commit).toHaveBeenCalledOnce();
    });

    it.each([TransportOrderStatus.Draft, TransportOrderStatus.Departed])('rejects departure in status %s', async (status) => {
        context.repository.findOne.mockResolvedValue(details({status}));
        await expect(context.service.depart('TO-1')).rejects.toBeInstanceOf(ConflictException);
        context.expectNoWrites();
    });
});
