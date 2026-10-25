import {onScopeDispose, watch} from 'vue'
import type {Ref} from 'vue'
import {useTransportOrdersStore} from '@/stores/transport-orders'
import {useCurrentUserStore} from '@/stores/current-user'
import type {TransportSummary} from '@/data/contracts'

export function useDraftPicker(open: Ref<boolean>, destination: Ref<string>, mode: Ref<string>) {
    const transports = useTransportOrdersStore()
    const user = useCurrentUserStore()
    let listController: AbortController | undefined
    let detailController: AbortController | undefined
    async function reloadDrafts() {
        listController?.abort()
        const request = new AbortController()
        listController = request
        transports.beginDrafts()
        try {
            const records: TransportSummary[] = []
            let page = 1
            while (true) {
                const result = await transports.fetchDraftPage(page, request.signal)
                if (request.signal.aborted) return
                records.push(...result.data)
                if (page >= result.totalPages) break
                page++
            }
            if (!request.signal.aborted) transports.finishDrafts(records)
        } catch (cause) {
            if (!request.signal.aborted) transports.failDrafts(cause)
        }
    }
    async function reloadDraftDetail() {
        detailController?.abort()
        if (!open.value || mode.value !== 'existing' || !destination.value) {
            transports.clearDraftDetail()
            return
        }
        detailController = new AbortController()
        await transports.loadDraftDetail(destination.value, detailController.signal)
    }
    watch([open, () => user.selectedId], ([visible]) => {
        listController?.abort()
        detailController?.abort()
        transports.clearDraftDetail()
        if (visible) void reloadDrafts()
        else transports.cancelDrafts()
    })
    watch([destination, mode], () => {
        if (mode.value === 'existing' && transports.draftDetail?.no === destination.value && transports.draftDetail.status === 0) return
        void reloadDraftDetail()
    })
    onScopeDispose(() => {
        listController?.abort()
        detailController?.abort()
        transports.cancelDrafts()
        transports.clearDraftDetail()
    })
    return {reloadDrafts, reloadDraftDetail}
}
