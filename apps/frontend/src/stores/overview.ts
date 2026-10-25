import {ref, watch} from 'vue'
import {defineStore} from 'pinia'
import {planningApi} from '../data/api'
import type {Status, TransportSummary} from '../data/contracts'
import {errorMessage} from '../utils/format'
import {useCurrentUserStore} from './current-user'
import {dataRevision} from './refresh'

export const useOverviewStore = defineStore('overview', () => {
    const user = useCurrentUserStore()
    const unplanned = ref(0)
    const counts = ref([0, 0, 0])
    const recent = ref<TransportSummary[]>([])
    const loading = ref(false)
    const error = ref('')
    let requestId = 0
    let loaded = false
    async function load() {
        const id = ++requestId
        loaded = true
        loading.value = true
        error.value = ''
        const identity = user.selectedId
        try {
            const [sales, ...statuses] = await Promise.all([
                planningApi.listSalesOrders({page: 1, limit: 1, status: 0}, identity),
                ...([0, 1, 2] as Status[]).map(status => planningApi.listTransportOrders({page: 1, limit: 1, status}, identity)),
            ])
            const transports: TransportSummary[] = []
            let page = 1
            while (true) {
                const result = await planningApi.listTransportOrders({page, limit: 100}, identity)
                transports.push(...result.data)
                if (page >= result.totalPages) break
                page++
            }
            if (id !== requestId) return
            unplanned.value = sales.total
            counts.value = statuses.map(result => result.total)
            recent.value = transports.sort((a, b) => Number(b.no.slice(3)) - Number(a.no.slice(3))).slice(0, 5)
        } catch (cause) {
            if (id === requestId) error.value = errorMessage(cause)
        } finally { if (id === requestId) loading.value = false }
    }
    watch(dataRevision, () => { if (loaded) void load() })
    return {unplanned, counts, recent, loading, error, load}
})
