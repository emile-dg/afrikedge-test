import {ref, watch} from 'vue'
import {defineStore} from 'pinia'
import {getDraftTransports, planningApi} from '../data/api'
import {ApiError} from '../data/api-error'
import type {CreateTransport, PaginatedResponse, Status, TransportDetails, TransportQuery, TransportSummary} from '../data/contracts'
import {errorMessage} from '../utils/format'
import {useCurrentUserStore} from './current-user'
import {dataChanged, dataRevision} from './refresh'

export const useTransportOrdersStore = defineStore('transport-orders', () => {
    const user = useCurrentUserStore()
    const query = ref<TransportQuery>({page: 1, limit: 10})
    const result = ref<PaginatedResponse<TransportSummary>>({data: [], total: 0, page: 1, limit: 10, totalPages: 0})
    const detail = ref<TransportDetails | null>(null)
    const drafts = ref<TransportDetails[]>([])
    const loading = ref(false)
    const detailLoading = ref(false)
    const draftsLoading = ref(false)
    const error = ref('')
    const detailError = ref('')
    const draftsError = ref('')
    const missing = ref(false)
    const pending = ref(false)
    const mutationError = ref('')
    let listId = 0
    let detailId = 0
    let draftsId = 0
    let loaded = false
    let draftsLoaded = false
    let activeNo = ''

    async function load() {
        const id = ++listId
        loading.value = true
        error.value = ''
        loaded = true
        try {
            const page = await planningApi.listTransportOrders({...query.value}, user.selectedId)
            if (id !== listId) return
            if (!page.data.length && page.total > 0 && query.value.page > page.totalPages) {
                query.value.page = page.totalPages
                return await load()
            }
            result.value = page
        } catch (cause) {
            if (id === listId) error.value = errorMessage(cause)
        } finally { if (id === listId) loading.value = false }
    }

    async function loadDetail(no: string) {
        const id = ++detailId
        activeNo = no
        detailLoading.value = true
        detailError.value = ''
        missing.value = false
        if (detail.value?.no !== no) detail.value = null
        try {
            const value = await planningApi.getTransportOrder(no, user.selectedId)
            if (id === detailId) detail.value = value
        } catch (cause) {
            if (id === detailId) {
                detail.value = null
                missing.value = cause instanceof ApiError && cause.status === 404
                detailError.value = errorMessage(cause)
            }
        } finally { if (id === detailId) detailLoading.value = false }
    }

    function releaseDetail() { activeNo = ''; detailId++; detailLoading.value = false }

    async function loadDrafts() {
        const id = ++draftsId
        draftsLoading.value = true
        draftsError.value = ''
        draftsLoaded = true
        try {
            const result = await getDraftTransports(user.selectedId)
            if (id === draftsId) drafts.value = result
        } catch (cause) {
            if (id === draftsId) draftsError.value = errorMessage(cause)
        } finally { if (id === draftsId) draftsLoading.value = false }
    }

    async function mutate<T>(action: (identity: string) => Promise<T>): Promise<T | null> {
        if (pending.value) return null
        pending.value = true
        mutationError.value = ''
        const identity = user.selectedId
        try {
            const value = await action(identity)
            dataChanged()
            if (activeNo) await loadDetail(activeNo)
            return value
        } catch (cause) {
            mutationError.value = errorMessage(cause)
            return null
        } finally { pending.value = false }
    }

    const create = (input: CreateTransport) => mutate(id => planningApi.createTransportOrder(input, id))
    const addLines = (no: string, salesOrderNos: string[]) => mutate(id => planningApi.addLines(no, salesOrderNos, id))
    const removeLine = (no: string, salesOrderNo: string) => mutate(async id => {
        await planningApi.removeLine(no, salesOrderNo, id)
        return true
    })
    const validate = (no: string) => mutate(id => planningApi.validateTransport(no, id))
    const depart = (no: string) => mutate(id => planningApi.departTransport(no, id))

    function setFilters(status: string, date: string) {
        query.value.status = status === '' ? undefined : Number(status) as Status
        query.value.date = date || undefined
        query.value.page = 1
        void load()
    }
    function setPage(page: number) { query.value.page = page; void load() }
    function setLimit(limit: number) { query.value.limit = limit; query.value.page = 1; void load() }

    watch(dataRevision, () => {
        if (loaded) void load()
        if (draftsLoaded) void loadDrafts()
    })
    return {query, result, detail, drafts, loading, detailLoading, draftsLoading, error, detailError, draftsError,
        missing, pending, mutationError, load, loadDetail, releaseDetail, loadDrafts, create, addLines, removeLine,
        validate, depart, setFilters, setPage, setLimit}
})
