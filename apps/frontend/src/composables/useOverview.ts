import {onMounted, onScopeDispose, watch} from 'vue'
import {useOverviewStore} from '@/stores/overview'
import {useCurrentUserStore} from '@/stores/current-user'
import type {Status, TransportSummary} from '@/data/contracts'

export function useOverview() {
    const overview = useOverviewStore()
    const user = useCurrentUserStore()
    let controller: AbortController | undefined
    async function reload() {
        controller?.abort()
        const request = new AbortController()
        controller = request
        overview.beginLoad()
        try {
            const [unplanned, ...counts] = await Promise.all([
                overview.fetchUnplannedCount(request.signal),
                ...([0, 1, 2] as Status[]).map(status => overview.fetchTransportCount(status, request.signal)),
            ])
            const records: TransportSummary[] = []
            let page = 1
            while (!request.signal.aborted) {
                const result = await overview.fetchRecentPage(page, request.signal)
                records.push(...result.data)
                if (page >= result.totalPages) break
                page++
            }
            if (!request.signal.aborted) overview.finishLoad(unplanned, counts, records)
        } catch (cause) {
            if (!request.signal.aborted) overview.failLoad(cause)
        }
    }
    onMounted(() => { void reload() })
    watch(() => user.selectedId, () => { void reload() })
    onScopeDispose(() => { controller?.abort(); overview.cancelLoad() })
    return {reload}
}
