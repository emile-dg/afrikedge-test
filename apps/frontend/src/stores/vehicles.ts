import {ref} from 'vue'
import {defineStore} from 'pinia'
import {useAPI} from '@/composables/useAPI'
import {useCurrentUserStore} from './current-user'
import type {TVehicle} from '@/data/contracts'
import {errorMessage} from '@/utils/format'

export const useVehiclesStore = defineStore('vehicles', () => {
    const api = useAPI()
    const user = useCurrentUserStore()
    const vehicles = ref<TVehicle[]>([])
    const loading = ref(false)
    const error = ref('')
    let requestId = 0
    async function load(signal?: AbortSignal) {
        const id = ++requestId
        const identity = user.selectedId
        loading.value = true
        error.value = ''
        try {
            const result = await api.request<TVehicle[]>('/vehicles', {signal})
            if (id === requestId && identity === user.selectedId && !signal?.aborted) vehicles.value = result
            return result
        } catch (cause) {
            if (id === requestId && !signal?.aborted && identity === user.selectedId) error.value = errorMessage(cause)
            return null
        } finally { if (id === requestId) loading.value = false }
    }
    return {vehicles, loading, error, load}
})
