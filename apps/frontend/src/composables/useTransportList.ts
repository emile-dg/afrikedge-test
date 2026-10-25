import {onScopeDispose, watch} from 'vue'
import {useTransportOrdersStore} from '@/stores/transport-orders'
import {useCurrentUserStore} from '@/stores/current-user'

export function useTransportList() {
    const transports = useTransportOrdersStore()
    const user = useCurrentUserStore()
    let controller: AbortController | undefined
    async function reload() {
        controller?.abort()
        const request = new AbortController()
        controller = request
        const result = await transports.load(request.signal)
        if (!request.signal.aborted && result && result.total > 0 && result.page > result.totalPages) {
            transports.setPage(result.totalPages)
        }
    }
    watch(() => [transports.query.page, transports.query.limit, transports.query.status, transports.query.date, user.selectedId],
        () => { void reload() }, {immediate: true})
    onScopeDispose(() => { controller?.abort() })
    return {reload}
}
