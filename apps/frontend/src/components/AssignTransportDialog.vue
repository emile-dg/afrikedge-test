<script setup lang="ts">
import type {TSalesOrder} from '@/data/contracts'
import {useTransportOrdersStore} from '@/stores/transport-orders'
import {useAssignment} from '@/composables/useAssignment'
import {formatDate, weight} from '@/utils/format'
import UiDialog from './UiDialog.vue'
import UiButton from './UiButton.vue'
import UiSelect from './UiSelect.vue'
import UiAlert from './UiAlert.vue'
import TransportFields from './TransportFields.vue'
import CapacityGauge from './CapacityGauge.vue'

const props = defineProps<{orders: TSalesOrder[]}>()
const open = defineModel<boolean>({default: false})
const emit = defineEmits<{assigned: [no: string]}>()
const transports = useTransportOrdersStore()
const {mode, destination, form, createdNo, busy, totalWeight, capacity, used, overflow, valid,
    submit, reloadDrafts, reloadDraftDetail} = useAssignment(open, () => props.orders, no => emit('assigned', no))
</script>

<template>
    <UiDialog v-model="open" title="Ajouter à un transport" :busy="busy">
        <p class="text-sm text-slate-600">{{ orders.length }} commande{{ orders.length > 1 ? 's' : '' }} ·
            <strong>{{ weight(totalWeight) }}</strong></p>
        <UiSelect v-model="mode" label="Destination" :disabled="busy || !!createdNo"
                  :options="[{value: 'existing', label: 'Transport existant'}, {value: 'new', label: 'Nouveau transport'}]"/>
        <template v-if="mode === 'existing'">
            <UiAlert v-if="transports.draftsError">{{ transports.draftsError }}
                <UiButton variant="ghost" size="sm" @click="reloadDrafts">Réessayer</UiButton>
            </UiAlert>
            <UiSelect v-model="destination" label="Transport en brouillon" placeholder="Choisir un transport" required
                      :disabled="busy || transports.draftsLoading"
                      :options="transports.drafts.map(item => ({value: item.no, label: item.no + ' · ' + item.vehicleCode + ' · ' + formatDate(item.deliveryDate) + ' · ' + weight(item.totalWeightKg) + ' affectés'}))"/>
            <p v-if="!transports.draftsLoading && !transports.drafts.length" class="text-sm text-slate-500">Aucun
                brouillon disponible. Choisissez « Nouveau transport ».</p>
        </template>
        <TransportFields v-else v-model="form" :disabled="busy"/>
        <p v-if="mode === 'existing' && transports.draftDetailLoading" role="status" class="text-sm text-slate-500">Chargement de la capacité…</p>
        <UiAlert v-if="mode === 'existing' && transports.draftDetailError">
            {{ transports.draftDetailError }}
            <UiButton variant="ghost" size="sm" @click="reloadDraftDetail">Réessayer</UiButton>
        </UiAlert>
        <UiAlert v-if="mode === 'existing' && transports.draftDetail?.no === destination && transports.draftDetail.status !== 0">
            Ce transport n’est plus en brouillon.
            <UiButton variant="ghost" size="sm" @click="reloadDrafts">Actualiser la liste</UiButton>
        </UiAlert>
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
