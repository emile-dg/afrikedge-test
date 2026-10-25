import {computed, ref, watch} from 'vue'
import type {Ref} from 'vue'
import type {CreateTransport, TSalesOrder} from '@/data/contracts'
import {useTransportOrdersStore} from '@/stores/transport-orders'
import {useVehiclesStore} from '@/stores/vehicles'
import {todayDate} from '@/utils/format'
import {useDraftPicker} from './useDraftPicker'
import {useTransportActions} from './useTransportActions'

export function useAssignment(open: Ref<boolean>, getOrders: () => TSalesOrder[], assigned: (no: string) => void) {
    const transports = useTransportOrdersStore()
    const vehicles = useVehiclesStore()
    const actions = useTransportActions()
    const mode = ref('existing')
    const destination = ref('')
    const form = ref<CreateTransport>({vehicleCode: '', deliveryDate: todayDate()})
    const createdNo = ref('')
    const submitting = ref(false)
    const picker = useDraftPicker(open, destination, mode)
    const busy = computed(() => submitting.value || transports.pending)
    const totalWeight = computed(() => getOrders().reduce((sum, order) => sum + Math.round(order.totalWeightKg * 100), 0) / 100)
    const target = computed(() => transports.draftDetail?.no === destination.value ? transports.draftDetail : null)
    const capacity = computed(() => mode.value === 'existing' ? target.value?.capacityKg :
        vehicles.vehicles.find(item => item.code === form.value.vehicleCode)?.capacityKg)
    const used = computed(() => (Math.round(totalWeight.value * 100) + Math.round((mode.value === 'existing' ? target.value?.totalWeightKg ?? 0 : 0) * 100)) / 100)
    const overflow = computed(() => capacity.value !== undefined && Math.round(used.value * 100) > Math.round(capacity.value * 100))
    const valid = computed(() => getOrders().length > 0 && !overflow.value && (mode.value === 'existing' ?
        !!target.value && target.value.status === 0 && !transports.draftDetailLoading :
        !!form.value.vehicleCode && form.value.deliveryDate >= todayDate() && !vehicles.loading))
    watch(open, (value) => {
        if (!value) return
        mode.value = 'existing'
        destination.value = ''
        createdNo.value = ''
        form.value = {vehicleCode: '', deliveryDate: todayDate()}
        transports.mutationError = ''
    })
    async function submit() {
        if (!valid.value || busy.value) return
        submitting.value = true
        try {
            const ids = getOrders().map(order => order.no)
            let no = destination.value
            if (mode.value === 'new') {
                const created = await actions.create({...form.value})
                if (!created) return
                transports.rememberCreated(created)
                no = created.no
                createdNo.value = no
                destination.value = no
                mode.value = 'existing'
            }
            const updated = await actions.addLines(no, ids)
            if (updated) { open.value = false; assigned(updated.no) }
        } finally { submitting.value = false }
    }
    return {mode, destination, form, createdNo, busy, totalWeight, capacity, used, overflow, valid, submit, ...picker}
}
