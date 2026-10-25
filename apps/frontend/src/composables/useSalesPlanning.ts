import {onMounted, onScopeDispose, watch} from 'vue'
import {useSalesOrdersStore} from '@/stores/sales-orders'
import {useCurrentUserStore} from '@/stores/current-user'
import type {TSalesOrder} from '@/data/contracts'

export function useSalesPlanning() {
    const sales = useSalesOrdersStore()
    const user = useCurrentUserStore()
    let controller: AbortController | undefined

    async function reload() {
        controller?.abort()
        const request = new AbortController()
        controller = request
        sales.beginLoad()
        try {
            const records: TSalesOrder[] = []
            let page = 1
            while (true) {
                const result = await sales.fetchPage({page, limit: 100}, request.signal)
                if (request.signal.aborted) return
                records.push(...result.data)
                if (page >= result.totalPages) break
                page++
            }
            if (!request.signal.aborted) sales.finishLoad(records)
        } catch (cause) {
            if (!request.signal.aborted) sales.failLoad(cause)
        }
    }
    onMounted(() => { void reload() })
    watch(() => user.selectedId, () => { sales.clearSelection(); void reload() })
    onScopeDispose(() => { controller?.abort(); sales.cancelLoad() })
    return {reload}
}
