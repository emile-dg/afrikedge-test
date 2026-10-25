<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import type {CreateTransport} from '@/data/contracts'
import {useTransportActions} from '@/composables/useTransportActions'
import {useTransportOrdersStore} from '@/stores/transport-orders'
import {todayDate} from '@/utils/format'
import UiDialog from './UiDialog.vue'
import UiButton from './UiButton.vue'
import UiAlert from './UiAlert.vue'
import TransportFields from './TransportFields.vue'

const open = defineModel<boolean>({default: false})
const emit = defineEmits<{created: [no: string]}>()
const transports = useTransportOrdersStore()
const actions = useTransportActions()
const form = ref<CreateTransport>({vehicleCode: '', deliveryDate: todayDate()})
const valid = computed(() => !!form.value.vehicleCode && !!form.value.deliveryDate && form.value.deliveryDate >= todayDate())
watch(open, (value) => {
    if (value) {
        form.value = {vehicleCode: '', deliveryDate: todayDate()}
        transports.mutationError = ''
    }
})
async function submit() {
    if (!valid.value) return
    const created = await actions.create({...form.value})
    if (created) { open.value = false; emit('created', created.no) }
}
</script>

<template>
    <UiDialog v-model="open" title="Nouveau transport" :busy="transports.pending">
        <p class="text-sm leading-6 text-slate-500">Choisissez un véhicule et une date. Le transport sera créé en brouillon.</p>
        <TransportFields v-if="open" v-model="form" :disabled="transports.pending" />
        <UiAlert v-if="transports.mutationError">{{ transports.mutationError }}</UiAlert>
        <template #footer>
            <UiButton variant="secondary" :disabled="transports.pending" @click="open = false">Annuler</UiButton>
            <UiButton :disabled="!valid" :loading="transports.pending" @click="submit">Créer le transport</UiButton>
        </template>
    </UiDialog>
</template>
