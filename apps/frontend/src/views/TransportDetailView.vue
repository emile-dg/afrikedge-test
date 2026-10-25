<script setup lang="ts">
import {computed, onUnmounted, ref, watch} from 'vue'
import {RouterLink, useRoute} from 'vue-router'
import {useTransportOrdersStore} from '@/stores/transport-orders'
import {useCurrentUserStore} from '@/stores/current-user'
import {formatDate, weight} from '@/utils/format'
import UiButton from '@/components/UiButton.vue'
import UiCard from '@/components/UiCard.vue'
import UiBadge from '@/components/UiBadge.vue'
import UiTable from '@/components/UiTable.vue'
import UiAlert from '@/components/UiAlert.vue'
import UiDialog from '@/components/UiDialog.vue'
import CapacityGauge from '@/components/CapacityGauge.vue'
import AddOrdersDialog from '@/components/AddOrdersDialog.vue'

const route = useRoute()
const transports = useTransportOrdersStore()
const user = useCurrentUserStore()
const no = computed(() => String(route.params.no))
const detail = computed(() => transports.detail)
const addOpen = ref(false)
const confirmationOpen = ref(false)
const action = ref<'remove' | 'validate' | 'depart'>('validate')
const salesOrderNo = ref('')
const success = ref('')
const columns = computed(() => [
    {key: 'no', label: 'Commande'}, {key: 'customerName', label: 'Client'}, {key: 'deliveryCity', label: 'Ville'},
    {key: 'totalWeightKg', label: 'Poids', align: 'right' as const}, {key: 'status', label: 'Statut'},
    ...(detail.value?.status === 0 && user.can('transport-orders:lines:remove') ? [{key: 'actions', label: ''}] : []),
])
const confirmTitle = computed(() => action.value === 'remove' ? 'Retirer la commande' : action.value === 'validate' ? 'Valider le transport' : 'Marquer le transport comme parti')
const confirmText = computed(() => action.value === 'remove' ?
    'La commande ' + salesOrderNo.value + ' sera remise dans les commandes à planifier.' :
    action.value === 'validate' ? 'Après validation, les commandes de ce transport ne pourront plus être modifiées.' :
    'Toutes les commandes associées passeront au statut « En livraison ».')
const canConfirm = computed(() => {
    if (!detail.value) return false
    if (action.value === 'validate') return detail.value.status === 0 && detail.value.salesOrders.length > 0 && user.can('transport-orders:validate')
    if (action.value === 'depart') return detail.value.status === 1 && user.can('transport-orders:depart')
    return detail.value.status === 0 && user.can('transport-orders:lines:remove')
})
function ask(kind: 'remove' | 'validate' | 'depart', order = '') {
    action.value = kind
    salesOrderNo.value = order
    transports.mutationError = ''
    confirmationOpen.value = true
}
async function confirm() {
    if (!canConfirm.value) return
    const result = action.value === 'remove' ? await transports.removeLine(no.value, salesOrderNo.value) :
        action.value === 'validate' ? await transports.validate(no.value) : await transports.depart(no.value)
    if (result) {
        confirmationOpen.value = false
        success.value = action.value === 'remove' ? 'La commande a été retirée.' : action.value === 'validate' ? 'Le transport a été validé.' : 'Le transport est parti.'
    }
}
watch(no, (value) => {
    success.value = ''
    confirmationOpen.value = false
    addOpen.value = false
    void transports.loadDetail(value)
}, {immediate: true})
onUnmounted(transports.releaseDetail)
</script>

<template>
    <div class="space-y-6">
        <RouterLink to="/transport-orders" class="inline-flex text-xs font-medium text-slate-500 hover:text-emerald-700">← Retour aux transports</RouterLink>
        <div v-if="transports.detailLoading && !detail" role="status" class="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Chargement du transport…</div>
        <UiAlert v-else-if="transports.detailError">
            {{ transports.missing ? 'Cet ordre de transport est introuvable.' : transports.detailError }}
            <UiButton v-if="!transports.missing" size="sm" variant="ghost" @click="transports.loadDetail(no)">Réessayer</UiButton>
        </UiAlert>
        <template v-else-if="detail">
            <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div class="flex flex-wrap items-center gap-3">
                        <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">{{ detail.no }}</h1><UiBadge :status="detail.status" />
                    </div>
                    <p class="mt-2 text-sm text-slate-500">Livraison le {{ formatDate(detail.deliveryDate) }}</p>
                </div>
                <div class="flex flex-wrap gap-2">
                    <UiButton v-if="detail.status === 0 && user.can('transport-orders:lines:add')" variant="secondary" :disabled="transports.pending" @click="addOpen = true">Ajouter des commandes</UiButton>
                    <UiButton v-if="detail.status === 0 && user.can('transport-orders:validate')" :disabled="!detail.salesOrders.length || transports.pending" @click="ask('validate')">Valider le transport</UiButton>
                    <UiButton v-if="detail.status === 1 && user.can('transport-orders:depart')" :disabled="transports.pending" @click="ask('depart')">Marquer comme parti</UiButton>
                </div>
            </div>
            <UiAlert v-if="success" kind="success">{{ success }}</UiAlert>
            <div class="grid min-w-0 gap-5 xl:grid-cols-2">
                <UiCard>
                    <template #header><h2 class="text-sm font-semibold">Véhicule & livraison</h2></template>
                    <dl class="grid grid-cols-2 gap-6 p-5 text-sm">
                        <div><dt class="text-xs text-slate-400">Véhicule</dt><dd class="mt-1.5 font-medium">{{ detail.vehicleCode }}</dd></div>
                        <div><dt class="text-xs text-slate-400">Immatriculation</dt><dd class="mt-1.5">{{ detail.plateNo }}</dd></div>
                        <div><dt class="text-xs text-slate-400">Créé par</dt><dd class="mt-1.5 capitalize">{{ detail.createdBy }}</dd></div>
                        <div><dt class="text-xs text-slate-400">Validé par</dt><dd class="mt-1.5 capitalize">{{ detail.validatedBy ?? '—' }}</dd></div>
                    </dl>
                </UiCard>
                <UiCard class="flex flex-col justify-center p-5"><CapacityGauge :used="detail.totalWeightKg" :capacity="detail.capacityKg" /></UiCard>
            </div>
            <UiCard>
                <template #header><h2 class="text-sm font-semibold">Commandes affectées <span class="ml-2 font-normal text-slate-400">{{ detail.salesOrders.length }}</span></h2></template>
                <UiTable :rows="detail.salesOrders" :columns="columns" empty-text="Aucune commande affectée. Ajoutez des commandes pour préparer ce transport." label="Commandes affectées">
                    <template #cell-no="{row}"><span class="font-medium text-slate-800">{{ row.no }}</span></template>
                    <template #cell-customerName="{row}"><span class="block whitespace-nowrap">{{ row.customerName }}</span><span class="mt-1 block text-xs text-slate-400">{{ row.customerNo }}</span></template>
                    <template #cell-totalWeightKg="{row}">{{ weight(row.totalWeightKg) }}</template>
                    <template #cell-status="{row}"><UiBadge kind="sales" :status="row.status" /></template>
                    <template #cell-actions="{row}"><UiButton variant="danger" size="sm" :disabled="transports.pending" :aria-label="'Retirer ' + row.no" @click="ask('remove', row.no)">Retirer</UiButton></template>
                </UiTable>
            </UiCard>
            <p v-if="detail.status !== 0" class="text-xs text-slate-400">Les commandes ne peuvent plus être modifiées après validation.</p>
            <p v-else-if="!user.can('transport-orders:validate')" class="text-xs text-slate-400">La validation est réservée au responsable logistique.</p>
            <AddOrdersDialog v-model="addOpen" :transport="detail" @added="success = 'Les commandes ont été ajoutées.'" />
        </template>
        <UiDialog v-model="confirmationOpen" :title="confirmTitle" :busy="transports.pending">
            <p class="text-sm leading-6 text-slate-600">{{ confirmText }}</p>
            <UiAlert v-if="transports.mutationError">{{ transports.mutationError }}</UiAlert>
            <template #footer>
                <UiButton variant="secondary" :disabled="transports.pending" @click="confirmationOpen = false">Annuler</UiButton>
                <UiButton :variant="action === 'remove' ? 'danger' : 'primary'" :loading="transports.pending" :disabled="!canConfirm" @click="confirm">Confirmer</UiButton>
            </template>
        </UiDialog>
    </div>
</template>
