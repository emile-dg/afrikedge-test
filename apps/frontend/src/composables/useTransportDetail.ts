import {onScopeDispose, watch} from 'vue'
import type {Ref} from 'vue'
import {useTransportOrdersStore} from '@/stores/transport-orders'
import {useCurrentUserStore} from '@/stores/current-user'

export function useTransportDetail(no: Ref<string>) {
    const transports = useTransportOrdersStore()
    const user = useCurrentUserStore()
    let controller: AbortController | undefined
    function reload() {
        controller?.abort()
        controller = new AbortController()
        return transports.loadDetail(no.value, controller.signal)
    }
    watch([no, () => user.selectedId], () => { void reload() }, {immediate: true})
    onScopeDispose(() => { controller?.abort(); transports.releaseDetail() })
    return {reload}
}
