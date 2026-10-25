import {computed, ref, watch} from 'vue'
import {defineStore} from 'pinia'
import {planningApi} from '../data/api'
import type {PaginatedResponse, SalesQuery, TSalesOrder} from '../data/contracts'
import {errorMessage} from '../utils/format'
import {useCurrentUserStore} from './current-user'
import {dataRevision} from './refresh'

export const useSalesOrdersStore = defineStore('sales-orders', () => {
    const user = useCurrentUserStore()
    const query = ref<SalesQuery>({page: 1, limit: 10, status: 0, city: ''})
    const result = ref<PaginatedResponse<TSalesOrder>>({data: [], total: 0, page: 1, limit: 10, totalPages: 0})
    const cities = ref<string[]>([])
    const selection = ref<TSalesOrder[]>([])
    const selectedIds = computed(() => selection.value.map(order => order.no))
    const selectedWeight = computed(() => selection.value.reduce((sum, order) => sum + Math.round(order.totalWeightKg * 100), 0) / 100)
    const loading = ref(false)
    const error = ref('')
    let requestId = 0
    let loaded = false

    async function load() {
        const id = ++requestId
        const params = {...query.value}
        const identity = user.selectedId
        loading.value = true
        error.value = ''
        loaded = true
        try {
            const [page, options] = await Promise.all([
                planningApi.listSalesOrders(params, identity), planningApi.listCities(identity),
            ])
            if (id !== requestId) return
            if (!page.data.length && page.total > 0 && params.page > page.totalPages) {
                query.value.page = page.totalPages
                return await load()
            }
            result.value = page
            cities.value = [...new Set([...options, ...(params.city ? [params.city] : [])])].sort((a, b) => a.localeCompare(b, 'fr'))
        } catch (cause) {
            if (id === requestId) error.value = errorMessage(cause)
        } finally {
            if (id === requestId) loading.value = false
        }
    }

    function select(ids: string[]) {
        const available = new Map([...selection.value, ...result.value.data].map(order => [order.no, order]))
        selection.value = ids.flatMap(id => available.has(id) ? [available.get(id)!] : [])
    }
    function clearSelection() { selection.value = [] }
    function setCity(city: string) {
        query.value.city = city
        query.value.page = 1
        clearSelection()
        void load()
    }
    function setPage(page: number) { query.value.page = page; void load() }
    function setLimit(limit: number) { query.value.limit = limit; query.value.page = 1; void load() }

    watch(dataRevision, () => { if (loaded) void load() })
    return {query, result, cities, selection, selectedIds, selectedWeight, loading, error,
        load, select, clearSelection, setCity, setPage, setLimit}
})
