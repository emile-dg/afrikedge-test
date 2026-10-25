import {onMounted, onScopeDispose, watch} from 'vue'
import {useVehiclesStore} from '@/stores/vehicles'
import {useCurrentUserStore} from '@/stores/current-user'

export function useVehicleData() {
    const vehicles = useVehiclesStore()
    const user = useCurrentUserStore()
    let controller: AbortController | undefined
    function reload() {
        controller?.abort()
        controller = new AbortController()
        return vehicles.load(controller.signal)
    }
    onMounted(() => { void reload() })
    watch(() => user.selectedId, () => { void reload() })
    onScopeDispose(() => { controller?.abort() })
    return {reload}
}
