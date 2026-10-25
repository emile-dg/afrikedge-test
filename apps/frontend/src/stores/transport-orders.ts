import {ref} from 'vue'
import {defineStore} from 'pinia'
import {useAPI} from '@/composables/useAPI'
import {ApiError} from '@/data/api-error'
import type {CreateTransport, PaginatedResponse, Status, TransportDetails, TransportQuery, TransportSummary} from '@/data/contracts'
import {errorMessage} from '@/utils/format'
import {useCurrentUserStore} from './current-user'

export const useTransportOrdersStore = defineStore('transport-orders', () => {
    const api = useAPI()
    const user = useCurrentUserStore()
    const query = ref<TransportQuery>({page: 1, limit: 10})
    const result = ref<PaginatedResponse<TransportSummary>>({data: [], total: 0, page: 1, limit: 10, totalPages: 0})
    const detail = ref<TransportDetails | null>(null)
    const drafts = ref<TransportSummary[]>([])
    const draftDetail = ref<TransportDetails | null>(null)
    const loading = ref(false)
    const detailLoading = ref(false)
    const draftsLoading = ref(false)
    const draftDetailLoading = ref(false)
    const error = ref('')
    const detailError = ref('')
    const draftsError = ref('')
    const draftDetailError = ref('')
    const missing = ref(false)
    const pending = ref(false)
    const mutationError = ref('')
    const dirty = ref(true)
    const draftsDirty = ref(true)
    let listId = 0
    let detailId = 0
    let draftDetailId = 0

    async function load(signal?: AbortSignal) {
        const id = ++listId
        const identity = user.selectedId
        loading.value = true
        error.value = ''
        try {
            const page = await api.request<PaginatedResponse<TransportSummary>>('/transport-orders', {query: {...query.value}, signal})
            if (id === listId && identity === user.selectedId && !signal?.aborted) {
                result.value = page
                dirty.value = false
            }
            return page
        } catch (cause) {
            if (id === listId && !signal?.aborted && identity === user.selectedId) error.value = errorMessage(cause)
            return null
        } finally { if (id === listId) loading.value = false }
    }

    async function loadDetail(no: string, signal?: AbortSignal) {
        const id = ++detailId
        const identity = user.selectedId
        detailLoading.value = true
        detailError.value = ''
        missing.value = false
        if (detail.value?.no !== no) detail.value = null
        try {
            const value = await api.request<TransportDetails>('/transport-orders/' + encodeURIComponent(no), {signal})
            if (id === detailId && identity === user.selectedId && !signal?.aborted) detail.value = value
            return value
        } catch (cause) {
            if (id === detailId && !signal?.aborted && identity === user.selectedId) {
                missing.value = cause instanceof ApiError && cause.status === 404
                detailError.value = errorMessage(cause)
            }
            return null
        } finally { if (id === detailId) detailLoading.value = false }
    }
    function releaseDetail() { detailId++; detailLoading.value = false }

    function fetchDraftPage(page: number, signal?: AbortSignal) {
        return api.request<PaginatedResponse<TransportSummary>>('/transport-orders', {query: {page, limit: 100, status: 0}, signal})
    }
    function beginDrafts() { draftsLoading.value = true; draftsError.value = '' }
    function finishDrafts(records: TransportSummary[]) { drafts.value = records; draftsLoading.value = false; draftsDirty.value = false }
    function failDrafts(cause: unknown) { draftsError.value = errorMessage(cause); draftsLoading.value = false }
    function cancelDrafts() { draftsLoading.value = false }
    function clearDraftDetail() { draftDetailId++; draftDetail.value = null; draftDetailError.value = ''; draftDetailLoading.value = false }

    async function loadDraftDetail(no: string, signal?: AbortSignal) {
        const id = ++draftDetailId
        const identity = user.selectedId
        draftDetail.value = null
        draftDetailLoading.value = true
        draftDetailError.value = ''
        try {
            const value = await api.request<TransportDetails>('/transport-orders/' + encodeURIComponent(no), {signal})
            if (id === draftDetailId && identity === user.selectedId && !signal?.aborted) draftDetail.value = value
            return value
        } catch (cause) {
            if (id === draftDetailId && !signal?.aborted && identity === user.selectedId) draftDetailError.value = errorMessage(cause)
            return null
        } finally { if (id === draftDetailId) draftDetailLoading.value = false }
    }

    function rememberCreated(value: TransportDetails) {
        drafts.value = [...drafts.value.filter(item => item.no !== value.no), value]
        draftDetail.value = value
    }
    function invalidate() { dirty.value = true; draftsDirty.value = true }

    async function mutate<T>(action: () => Promise<T>): Promise<T | null> {
        if (pending.value) return null
        pending.value = true
        mutationError.value = ''
        try { return await action() }
        catch (cause) {
            const fields = cause instanceof ApiError ? cause.errors.map(issue => issue.field + ' : ' + issue.message) : []
            mutationError.value = [errorMessage(cause), ...fields].join(' · ')
            return null
        } finally { pending.value = false }
    }
    function apply(value: TransportDetails) {
        if (detail.value?.no === value.no) {
            detailId++
            detail.value = value
            detailError.value = ''
            detailLoading.value = false
        }
        if (draftDetail.value?.no === value.no) {
            draftDetailId++
            draftDetail.value = value
            draftDetailLoading.value = false
        }
        invalidate()
        return value
    }
    const create = (input: CreateTransport) => mutate(async () => apply(await api.request<TransportDetails>('/transport-orders', {method: 'POST', body: input})))
    const addLines = (no: string, salesOrderNos: string[]) => mutate(async () => apply(await api.request<TransportDetails>(
        '/transport-orders/' + encodeURIComponent(no) + '/lines', {method: 'POST', body: {salesOrderNos}})))
    const removeLine = (no: string, salesOrderNo: string) => mutate(async () => {
        await api.request<void>('/transport-orders/' + encodeURIComponent(no) + '/lines/' + encodeURIComponent(salesOrderNo), {method: 'DELETE'})
        invalidate()
        return true
    })
    const validate = (no: string) => mutate(async () => apply(await api.request<TransportDetails>('/transport-orders/' + encodeURIComponent(no) + '/validate', {method: 'POST'})))
    const depart = (no: string) => mutate(async () => apply(await api.request<TransportDetails>('/transport-orders/' + encodeURIComponent(no) + '/depart', {method: 'POST'})))

    function setFilters(status: string, date: string) {
        query.value.status = status === '' ? undefined : Number(status) as Status
        query.value.date = date || undefined
        query.value.page = 1
    }
    function setPage(page: number) { query.value.page = page }
    function setLimit(limit: number) { query.value.limit = limit; query.value.page = 1 }

    return {query, result, detail, drafts, draftDetail, loading, detailLoading, draftsLoading, draftDetailLoading,
        error, detailError, draftsError, draftDetailError, missing, pending, mutationError, dirty, draftsDirty,
        load, loadDetail, releaseDetail, fetchDraftPage, beginDrafts, finishDrafts, failDrafts, cancelDrafts,
        clearDraftDetail, loadDraftDetail, rememberCreated, invalidate, create, addLines, removeLine, validate, depart,
        setFilters, setPage, setLimit}
})
