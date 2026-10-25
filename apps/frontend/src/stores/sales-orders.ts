import {computed, ref} from 'vue'
import {defineStore} from 'pinia'
import {useAPI} from '@/composables/useAPI'
import type {PaginatedResponse, SalesQuery, TSalesOrder} from '@/data/contracts'
import {errorMessage} from '@/utils/format'

export const useSalesOrdersStore = defineStore('sales-orders', () => {
    const api = useAPI()
    const query = ref({page: 1, limit: 10, city: ''})
    const orders = ref<TSalesOrder[]>([])
    const selection = ref<TSalesOrder[]>([])
    const loading = ref(false)
    const error = ref('')
    const dirty = ref(true)
    const selectedIds = computed(() => selection.value.map(order => order.no))
    const selectedWeight = computed(() => selection.value.reduce((sum, order) => sum + Math.round(order.totalWeightKg * 100), 0) / 100)
    const cities = computed(() => [...new Set([...orders.value.map(order => order.deliveryCity), ...(query.value.city ? [query.value.city] : [])])].sort((a, b) => a.localeCompare(b, 'fr')))
    const filtered = computed(() => orders.value.filter(order => !query.value.city || order.deliveryCity === query.value.city))
    const result = computed<PaginatedResponse<TSalesOrder>>(() => ({
        data: filtered.value.slice((query.value.page - 1) * query.value.limit, query.value.page * query.value.limit),
        total: filtered.value.length, page: query.value.page, limit: query.value.limit,
        totalPages: Math.ceil(filtered.value.length / query.value.limit),
    }))

    function fetchPage(params: SalesQuery, signal?: AbortSignal) {
        return api.request<PaginatedResponse<TSalesOrder>>('/sales-orders/to-plan', {
            query: {page: params.page, limit: params.limit}, signal,
        })
    }
    function beginLoad() { loading.value = true; error.value = '' }
    function finishLoad(records: TSalesOrder[]) {
        orders.value = records
        dirty.value = false
        query.value.page = Math.min(query.value.page, Math.max(1, Math.ceil(filtered.value.length / query.value.limit)))
        const available = new Map(records.map(order => [order.no, order]))
        selection.value = selection.value.flatMap(order => available.has(order.no) ? [available.get(order.no)!] : [])
        loading.value = false
    }
    function failLoad(cause: unknown) { error.value = errorMessage(cause); loading.value = false }
    function cancelLoad() { loading.value = false }
    function invalidate() { dirty.value = true }
    function select(ids: string[]) {
        const available = new Map(orders.value.map(order => [order.no, order]))
        selection.value = ids.flatMap(id => available.has(id) ? [available.get(id)!] : [])
    }
    function clearSelection() { selection.value = [] }
    function setCity(city: string) { query.value.city = city; query.value.page = 1; clearSelection() }
    function setPage(page: number) { query.value.page = page }
    function setLimit(limit: number) { query.value.limit = limit; query.value.page = 1 }
    return {query, orders, result, cities, selection, selectedIds, selectedWeight, loading, error, dirty,
        fetchPage, beginLoad, finishLoad, failLoad, cancelLoad, invalidate, select, clearSelection, setCity, setPage, setLimit}
})
