import {beforeEach, describe, expect, it} from 'vitest'
import {createFakeApi} from '../fake-api'
import type {PlanningApi} from '../contracts'
import {ApiError} from '../api-error'

describe('Fake planning adapter', () => {
    let api: PlanningApi
    beforeEach(() => {
        api = createFakeApi({delay: 0, now: () => new Date('2026-10-25T12:00:00Z')})
    })
    const createInput = {vehicleCode: 'VH-04', deliveryDate: '2026-10-28'}

    it('matches assessment seed counts, weights and assignments', async () => {
        expect(await api.listVehicles('diane')).toHaveLength(9)
        expect((await api.listSalesOrders({page: 1, limit: 100}, 'diane')).total).toBe(40)
        expect((await api.listTransportOrders({page: 1, limit: 100}, 'diane')).total).toBe(4)
        expect(await api.getTransportOrder('TO-0003', 'diane')).toMatchObject({totalWeightKg: 1360, capacityKg: 1500, remainingCapacityKg: 140, deliveryDate: '2026-10-26'})
        expect((await api.getTransportOrder('TO-0001', 'eric')).totalWeightKg).toBe(2050)
        expect((await api.getTransportOrder('TO-0002', 'eric')).totalWeightKg).toBe(3350)
    })

    it('filters city before pagination and preserves totals outside the result set', async () => {
        const all = await api.listSalesOrders({page: 1, limit: 100, status: 0, city: 'Douala'}, 'diane')
        const first = await api.listSalesOrders({page: 1, limit: 2, status: 0, city: 'Douala'}, 'diane')
        expect(first.data).toEqual(all.data.slice(0, 2))
        expect(first.total).toBe(all.total)
        expect(first.totalPages).toBe(Math.ceil(all.total / 2))
        expect(first.data.every(order => order.deliveryCity === 'Douala' && order.status === 0)).toBe(true)
        expect(await api.listSalesOrders({page: 99, limit: 2, status: 0, city: 'Douala'}, 'diane'))
            .toMatchObject({data: [], total: all.total, page: 99})
    })

    it('filters transport status and date independently or together', async () => {
        const status = await api.listTransportOrders({page: 1, limit: 10, status: 0}, 'diane')
        expect(status.data.map(item => item.no)).toEqual(['TO-0003', 'TO-0004'])
        const date = await api.listTransportOrders({page: 1, limit: 10, date: '2026-10-26'}, 'diane')
        expect(date.total).toBe(2)
        const both = await api.listTransportOrders({page: 1, limit: 10, status: 0, date: '2026-10-26'}, 'diane')
        expect(both.data.map(item => item.no)).toEqual(['TO-0003'])
    })

    it('returns detached records', async () => {
        const detail = await api.getTransportOrder('TO-0003', 'diane')
        detail.salesOrders[0]!.totalWeightKg = 99999
        detail.status = 2
        expect((await api.getTransportOrder('TO-0003', 'diane')).totalWeightKg).toBe(1360)
        expect((await api.getTransportOrder('TO-0003', 'diane')).status).toBe(0)
    })

    it('resets business data with a new source instance', async () => {
        await api.createTransportOrder(createInput, 'diane')
        const fresh = createFakeApi({delay: 0})
        expect((await fresh.listTransportOrders({page: 1, limit: 100}, 'diane')).total).toBe(4)
    })

    it.each(['', 'unknown'])('rejects unknown identity %s', async (identity) => {
        await expect(api.listVehicles(identity)).rejects.toMatchObject({status: 401})
    })

    it('allows both roles to create and only the manager to validate', async () => {
        const first = await api.createTransportOrder(createInput, 'diane')
        const second = await api.createTransportOrder({...createInput, vehicleCode: 'VH-05'}, 'eric')
        expect(first).toMatchObject({status: 0, createdBy: 'diane', validatedBy: null})
        expect(second.createdBy).toBe('eric')
        await api.addLines(first.no, ['SO-1008'], 'diane')
        await expect(api.validateTransport(first.no, 'diane')).rejects.toMatchObject({status: 403})
        expect(await api.validateTransport(first.no, 'eric')).toMatchObject({status: 1, validatedBy: 'eric'})
    })

    it.each([
        {vehicleCode: 'VH-07', deliveryDate: '2026-10-28'},
        {vehicleCode: 'missing', deliveryDate: '2026-10-28'},
        {vehicleCode: 'VH-04', deliveryDate: '2026-10-24'},
        {vehicleCode: 'VH-04', deliveryDate: '2026-02-30'},
        {vehicleCode: 'VH-04', deliveryDate: '2026-10-27'},
    ])('rejects invalid scheduling %j', async (input) => {
        await expect(api.createTransportOrder(input, 'diane')).rejects.toBeInstanceOf(ApiError)
        expect((await api.listTransportOrders({page: 1, limit: 100}, 'diane')).total).toBe(4)
    })

    it('uses Douala midnight to reject yesterday', async () => {
        api = createFakeApi({delay: 0, now: () => new Date('2026-10-24T23:05:00Z')})
        await expect(api.createTransportOrder({vehicleCode: 'VH-05', deliveryDate: '2026-10-24'}, 'diane')).rejects.toMatchObject({status: 400})
        expect((await api.createTransportOrder({vehicleCode: 'VH-05', deliveryDate: '2026-10-25'}, 'diane')).deliveryDate).toBe('2026-10-25')
    })

    it('assigns batches and synchronizes sales statuses', async () => {
        const updated = await api.addLines('TO-0004', ['SO-1008', 'SO-1009'], 'diane')
        expect(updated.totalWeightKg).toBe(810)
        expect(updated.salesOrders.every(order => order.status === 1)).toBe(true)
        const unplanned = await api.listSalesOrders({page: 1, limit: 100, status: 0}, 'diane')
        expect(unplanned.data.some(order => order.no === 'SO-1008')).toBe(false)
    })

    it.each([{ids: []}, {ids: ['SO-1008', 'SO-1008']}, {ids: ['SO-1008', ' so-1008 ']}])('rejects malformed or duplicate batches %j', async ({ids}) => {
        await expect(api.addLines('TO-0004', ids, 'diane')).rejects.toMatchObject({status: 400})
        expect((await api.getTransportOrder('TO-0004', 'diane')).salesOrders).toHaveLength(0)
    })

    it('does not partially assign a batch containing an invalid order', async () => {
        await expect(api.addLines('TO-0004', ['SO-1008', 'missing'], 'diane')).rejects.toMatchObject({status: 404})
        expect((await api.getTransportOrder('TO-0004', 'diane')).salesOrders).toEqual([])
        expect((await api.listSalesOrders({page: 1, limit: 100, status: 0}, 'diane')).data.some(order => order.no === 'SO-1008')).toBe(true)
    })

    it('rejects already assigned orders', async () => {
        await expect(api.addLines('TO-0004', ['SO-1006'], 'diane')).rejects.toMatchObject({status: 409})
    })

    it('includes existing weight and rejects capacity overflow without writes', async () => {
        await expect(api.addLines('TO-0003', ['SO-1013'], 'diane')).rejects.toMatchObject({status: 409})
        expect((await api.getTransportOrder('TO-0003', 'diane')).totalWeightKg).toBe(1360)
    })

    it('allows exact capacity', async () => {
        const transport = await api.createTransportOrder({vehicleCode: 'VH-02', deliveryDate: '2026-10-28'}, 'diane')
        const details = await api.addLines(transport.no, ['SO-1014', 'SO-1020'], 'diane')
        expect(details.totalWeightKg).toBe(2500)
        expect(details.remainingCapacityKg).toBe(0)
    })

    it('calculates decimal weights in hundredths', async () => {
        expect((await api.addLines('TO-0004', ['SO-1013', 'SO-1015'], 'diane')).totalWeightKg).toBe(456.25)
    })

    it('removal restores the sales order status', async () => {
        await api.removeLine('TO-0003', 'SO-1006', 'diane')
        expect((await api.getTransportOrder('TO-0003', 'diane')).totalWeightKg).toBe(720)
        expect((await api.listSalesOrders({page: 1, limit: 100, status: 0}, 'diane')).data.some(order => order.no === 'SO-1006')).toBe(true)
    })

    it('rejects nonmember removal', async () => {
        await expect(api.removeLine('TO-0003', 'SO-1008', 'diane')).rejects.toMatchObject({status: 404})
    })

    it.each(['TO-0001', 'TO-0002'])('prevents modifications to %s', async (no) => {
        await expect(api.addLines(no, ['SO-1008'], 'diane')).rejects.toMatchObject({status: 409})
        await expect(api.removeLine(no, 'SO-1001', 'diane')).rejects.toMatchObject({status: 409})
    })

    it('rejects empty validation and invalid departure', async () => {
        await expect(api.validateTransport('TO-0004', 'eric')).rejects.toMatchObject({status: 409})
        await expect(api.departTransport('TO-0003', 'diane')).rejects.toMatchObject({status: 409})
        await expect(api.departTransport('TO-0001', 'eric')).rejects.toMatchObject({status: 409})
    })

    it('departs validated transports for either role and updates every sales order', async () => {
        const departed = await api.departTransport('TO-0002', 'diane')
        expect(departed.status).toBe(2)
        expect(departed.salesOrders.every(order => order.status === 2)).toBe(true)
    })

    it('serializes competing assignments without partial changes', async () => {
        const other = await api.createTransportOrder(createInput, 'diane')
        const outcomes = await Promise.allSettled([
            api.addLines('TO-0004', ['SO-1008'], 'diane'),
            api.addLines(other.no, ['SO-1008'], 'diane'),
        ])
        expect(outcomes.filter(item => item.status === 'fulfilled')).toHaveLength(1)
    })

    it('rejects duplicate scheduling under concurrent calls', async () => {
        const outcomes = await Promise.allSettled([
            api.createTransportOrder(createInput, 'diane'), api.createTransportOrder(createInput, 'eric'),
        ])
        expect(outcomes.filter(item => item.status === 'fulfilled')).toHaveLength(1)
    })

    it('keeps a successfully created empty draft when a later assignment fails', async () => {
        const created = await api.createTransportOrder({vehicleCode: 'VH-09', deliveryDate: '2026-10-28'}, 'diane')
        await expect(api.addLines(created.no, ['SO-1010'], 'diane')).rejects.toMatchObject({status: 409})
        expect((await api.getTransportOrder(created.no, 'diane')).salesOrders).toEqual([])
    })
})
