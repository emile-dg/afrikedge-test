import {computed, ref} from 'vue'
import {defineStore} from 'pinia'
import {useAPI} from '@/composables/useAPI'
import type {PaginatedResponse, Status, TransportSummary, TSalesOrder} from '@/data/contracts'
import {errorMessage} from '@/utils/format'

export const useOverviewStore = defineStore('overview', () => {
    const api = useAPI()
    const unplanned = ref(0)
    const counts = ref([0, 0, 0])
    const recent = ref<TransportSummary[]>([])
    const batchLoading = ref(false)
    const requests = ref(0)
    const loading = computed(() => batchLoading.value || requests.value > 0)
    const error = ref('')
    const dirty = ref(true)

    async function task<T>(action: () => Promise<T>): Promise<T> {
        requests.value++
        try { return await action() } finally { requests.value-- }
    }
    const fetchUnplannedCount = (signal?: AbortSignal) => task(async () =>
        (await api.request<PaginatedResponse<TSalesOrder>>('/sales-orders/to-plan', {query: {page: 1, limit: 1}, signal})).total)
    const fetchTransportCount = (status: Status, signal?: AbortSignal) => task(async () =>
        (await api.request<PaginatedResponse<TransportSummary>>('/transport-orders', {query: {page: 1, limit: 1, status}, signal})).total)
    const fetchRecentPage = (page: number, signal?: AbortSignal) => task(() =>
        api.request<PaginatedResponse<TransportSummary>>('/transport-orders', {query: {page, limit: 100}, signal}))

    function beginLoad() { batchLoading.value = true; error.value = '' }
    function finishLoad(total: number, statuses: number[], records: TransportSummary[]) {
        unplanned.value = total
        counts.value = statuses
        recent.value = records.sort((a, b) => Number(b.no.slice(3)) - Number(a.no.slice(3))).slice(0, 5)
        dirty.value = false
        batchLoading.value = false
    }
    function failLoad(cause: unknown) { error.value = errorMessage(cause); batchLoading.value = false }
    function cancelLoad() { batchLoading.value = false }
    function invalidate() { dirty.value = true }
    return {unplanned, counts, recent, loading, error, dirty, fetchUnplannedCount, fetchTransportCount, fetchRecentPage,
        beginLoad, finishLoad, failLoad, cancelLoad, invalidate}
})
