<script setup lang="ts">
import {computed, watch} from 'vue'
import type {TransportDetails} from '@/data/contracts'
import {useSalesOrdersStore} from '@/stores/sales-orders'
import {useTransportActions} from '@/composables/useTransportActions'
import {useTransportOrdersStore} from '@/stores/transport-orders'
import UiDialog from './UiDialog.vue'
import UiButton from './UiButton.vue'
import UiAlert from './UiAlert.vue'
import SalesSelection from './SalesSelection.vue'
import CapacityGauge from './CapacityGauge.vue'

const props = defineProps<{transport: TransportDetails}>()
const open = defineModel<boolean>({default: false})
const emit = defineEmits<{added: []}>()
const sales = useSalesOrdersStore()
const transports = useTransportOrdersStore()
const actions = useTransportActions()
const used = computed(() => (Math.round(props.transport.totalWeightKg * 100) + Math.round(sales.selectedWeight * 100)) / 100)
const overflow = computed(() => used.value > props.transport.capacityKg)
watch(open, (value) => {
    if (value) {
        sales.clearSelection()
        sales.query.city = ''
        sales.query.page = 1
        transports.mutationError = ''
    }
})
async function submit() {
    if (overflow.value || !sales.selection.length) return
    const updated = await actions.addLines(props.transport.no, [...sales.selectedIds])
    if (updated) { sales.clearSelection(); open.value = false; emit('added') }
}
</script>

<template>
    <UiDialog v-model="open" :title="'Ajouter des commandes · ' + transport.no" :busy="transports.pending" wide>
        <CapacityGauge :used="used" :capacity="transport.capacityKg" />
        <SalesSelection v-if="open" />
        <UiAlert v-if="overflow">Le poids sélectionné dépasse la capacité disponible.</UiAlert>
        <UiAlert v-if="transports.mutationError">{{ transports.mutationError }}</UiAlert>
        <template #footer>
            <UiButton variant="secondary" :disabled="transports.pending" @click="open = false">Annuler</UiButton>
            <UiButton :disabled="sales.loading || !!sales.error || !sales.selection.length || overflow || transport.status !== 0" :loading="transports.pending" @click="submit">Ajouter au transport</UiButton>
        </template>
    </UiDialog>
</template>
