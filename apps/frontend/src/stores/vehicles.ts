import {ref} from 'vue'
import {defineStore} from 'pinia'
import {planningApi} from '../data/api'
import type {TVehicle} from '../data/contracts'
import {errorMessage} from '../utils/format'
import {useCurrentUserStore} from './current-user'

export const useVehiclesStore = defineStore('vehicles', () => {
    const vehicles = ref<TVehicle[]>([])
    const loading = ref(false)
    const error = ref('')
    const user = useCurrentUserStore()
    let requestId = 0
    async function load() {
        const id = ++requestId
        loading.value = true
        error.value = ''
        try {
            const result = await planningApi.listVehicles(user.selectedId)
            if (id === requestId) vehicles.value = result
        } catch (cause) {
            if (id === requestId) error.value = errorMessage(cause)
        } finally {
            if (id === requestId) loading.value = false
        }
    }
    return {vehicles, loading, error, load}
})
