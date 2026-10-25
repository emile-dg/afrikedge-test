<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import type {CreateTransport, TSalesOrder} from '@/data/contracts'
import {useTransportOrdersStore} from '@/stores/transport-orders'
import {useVehiclesStore} from '@/stores/vehicles'
import {formatDate, todayDate, weight} from '@/utils/format'
import UiDialog from './UiDialog.vue'
import UiButton from './UiButton.vue'
import UiSelect from './UiSelect.vue'
import UiAlert from './UiAlert.vue'
import TransportFields from './TransportFields.vue'
import CapacityGauge from './CapacityGauge.vue'

const props = defineProps<{ orders: TSalesOrder[] }>()
const open = defineModel<boolean>({default: false})
const emit = defineEmits<{ assigned: [no: string] }>()
const transports = useTransportOrdersStore()
const vehicles = useVehiclesStore()
const mode = ref('existing')
const destination = ref('')
const form = ref<CreateTransport>({vehicleCode: '', deliveryDate: todayDate()})
const createdNo = ref('')
const submitting = ref(false)
const busy = computed(() => submitting.value || transports.pending)
const totalWeight = computed(() => props.orders.reduce((sum, order) => sum + Math.round(order.totalWeightKg * 100), 0) / 100)
const target = computed(() => transports.drafts.find(item => item.no === destination.value))
const capacity = computed(() => mode.value === 'existing' ? target.value?.capacityKg : vehicles.vehicles.find(item => item.code === form.value.vehicleCode)?.capacityKg)
const used = computed(() => totalWeight.value + (mode.value === 'existing' ? target.value?.totalWeightKg ?? 0 : 0))
const overflow = computed(() => capacity.value !== undefined && Math.round(used.value * 100) > Math.round(capacity.value * 100))
const valid = computed(() => props.orders.length > 0 && !overflow.value && (mode.value === 'existing' ?
    !!target.value : !!form.value.vehicleCode && form.value.deliveryDate >= todayDate()))
watch(open, (value) => {
    if (!value) return
    mode.value = 'existing'
    destination.value = ''
    createdNo.value = ''
    form.value = {vehicleCode: '', deliveryDate: todayDate()}
    transports.mutationError = ''
    void transports.loadDrafts()
})

async function submit() {
    if (!valid.value || busy.value) return
    submitting.value = true
    try {
        const ids = props.orders.map(order => order.no)
        let no = destination.value
        if (mode.value === 'new') {
            const created = await transports.create({...form.value})
            if (!created) return
            no = created.no
            createdNo.value = no
            destination.value = no
            mode.value = 'existing'
            await transports.loadDrafts()
        }
        const updated = await transports.addLines(no, ids)
        if (updated) {
            open.value = false;
            emit('assigned', updated.no)
        }
    } finally {
        submitting.value = false
    }
}
</script>

<template>
    <UiDialog v-model="open" title="Ajouter à un transport" :busy="busy">
        <p class="text-sm text-slate-600">{{ orders.length }} commande{{ orders.length > 1 ? 's' : '' }} ·
            <strong>{{ weight(totalWeight) }}</strong></p>
        <UiSelect v-model="mode" label="Destination" :disabled="busy || !!createdNo"
                  :options="[{value: 'existing', label: 'Transport existant'}, {value: 'new', label: 'Nouveau transport'}]"/>
        <template v-if="mode === 'existing'">
            <UiAlert v-if="transports.draftsError">{{ transports.draftsError }}
                <UiButton variant="ghost" size="sm" @click="transports.loadDrafts">Réessayer</UiButton>
            </UiAlert>
            <UiSelect v-model="destination" label="Transport en brouillon" placeholder="Choisir un transport" required
                      :disabled="busy || transports.draftsLoading"
                      :options="transports.drafts.map(item => ({value: item.no, label: item.no + ' · ' + item.vehicleCode + ' · ' + formatDate(item.deliveryDate) + ' · ' + weight(item.remainingCapacityKg) + ' libres'}))"/>
            <p v-if="!transports.draftsLoading && !transports.drafts.length" class="text-sm text-slate-500">Aucun
                brouillon disponible. Choisissez « Nouveau transport ».</p>
        </template>
        <TransportFields v-else v-model="form" :disabled="busy"/>
        <CapacityGauge v-if="capacity !== undefined" :used="used" :capacity="capacity"/>
        <UiAlert v-if="overflow">
            La sélection dépasse la capacité disponible. Choisissez un autre transport ou réduisez la sélection.
        </UiAlert>
        <UiAlert v-if="createdNo" kind="info">
            Le brouillon {{ createdNo }} a été créé. En cas d’échec de l’ajout, vous pouvez réessayer sur ce transport.
        </UiAlert>
        <UiAlert v-if="transports.mutationError">{{ transports.mutationError }}</UiAlert>
        <template #footer>
            <UiButton variant="secondary" :disabled="busy" @click="open = false">Annuler</UiButton>
            <UiButton :disabled="!valid || transports.draftsLoading" :loading="busy" @click="submit">
                Ajouter les  commandes
            </UiButton>
        </template>
    </UiDialog>
</template>
