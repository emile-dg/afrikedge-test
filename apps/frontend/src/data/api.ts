import type {PlanningApi} from './contracts'
import {createFakeApi} from './fake-api'

export const planningApi: PlanningApi = createFakeApi()

export async function getDraftTransports(userId: string) {
    const drafts = []
    let page = 1
    while (true) {
        const result = await planningApi.listTransportOrders({page, limit: 100, status: 0}, userId)
        drafts.push(...await Promise.all(result.data.map(item => planningApi.getTransportOrder(item.no, userId))))
        if (page >= result.totalPages) return drafts
        page++
    }
}
