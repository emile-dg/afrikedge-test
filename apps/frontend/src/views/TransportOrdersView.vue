<script setup lang="ts">
import {onMounted, ref} from 'vue'
import {RouterLink, useRouter} from 'vue-router'
import {useTransportOrdersStore} from '@/stores/transport-orders'
import {useCurrentUserStore} from '@/stores/current-user'
import {formatDate, weight} from '@/utils/format'
import UiButton from '@/components/UiButton.vue'
import UiCard from '@/components/UiCard.vue'
import UiSelect from '@/components/UiSelect.vue'
import UiInput from '@/components/UiInput.vue'
import UiTable from '@/components/UiTable.vue'
import UiPagination from '@/components/UiPagination.vue'
import UiBadge from '@/components/UiBadge.vue'
import CreateTransportDialog from '@/components/CreateTransportDialog.vue'

const transports = useTransportOrdersStore()
const user = useCurrentUserStore()
const router = useRouter()
const createOpen = ref(false)
const columns = [
    {key: 'no', label: 'Transport'}, {key: 'vehicleCode', label: 'Véhicule'},
    {key: 'deliveryDate', label: 'Livraison'}, {key: 'status', label: 'Statut'},
    {key: 'totalWeightKg', label: 'Poids', align: 'right' as const},
    {key: 'createdBy', label: 'Créé par'}, {key: 'validatedBy', label: 'Validé par'}, {key: 'actions', label: ''},
]
const statuses = [{value: '', label: 'Tous les statuts'}, {value: '0', label: 'Brouillon'}, {value: '1', label: 'Validé'}, {value: '2', label: 'Parti'}]
function created(no: string) { void router.push('/transport-orders/' + encodeURIComponent(no)) }
onMounted(() => { void transports.load() })
</script>

<template>
    <div class="space-y-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
                <p class="text-[10px] font-semibold tracking-widest text-emerald-700 uppercase">Livraisons</p>
                <h1 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Ordres de transport</h1>
                <p class="mt-2 text-sm text-slate-500">Organisez vos tournées et suivez leur avancement.</p>
            </div>
            <UiButton v-if="user.can('transport-orders:create')" @click="createOpen = true">+ Nouveau transport</UiButton>
        </div>
        <div class="flex flex-wrap items-end gap-3">
            <UiSelect class="w-full sm:w-52" label="Statut" :options="statuses" :model-value="transports.query.status === undefined ? '' : String(transports.query.status)"
                @update:model-value="transports.setFilters($event, transports.query.date ?? '')" />
            <UiInput class="w-full sm:w-52" label="Date de livraison" type="date" :model-value="transports.query.date ?? ''"
                @update:model-value="transports.setFilters(transports.query.status === undefined ? '' : String(transports.query.status), $event)" />
            <UiButton variant="ghost" size="sm" :disabled="transports.query.status === undefined && !transports.query.date" @click="transports.setFilters('', '')">Réinitialiser les filtres</UiButton>
        </div>
        <UiCard>
            <UiTable :rows="transports.result.data" :columns="columns" :loading="transports.loading" :error="transports.error"
                empty-text="Aucun transport ne correspond aux filtres." label="Ordres de transport" @retry="transports.load">
                <template #cell-no="{row}"><RouterLink class="font-medium text-emerald-800 hover:underline" :to="'/transport-orders/' + row.no">{{ row.no }}</RouterLink></template>
                <template #cell-deliveryDate="{row}"><span class="whitespace-nowrap">{{ formatDate(row.deliveryDate) }}</span></template>
                <template #cell-status="{row}"><UiBadge :status="row.status" /></template>
                <template #cell-totalWeightKg="{row}">{{ weight(row.totalWeightKg) }}</template>
                <template #cell-createdBy="{row}"><span class="capitalize">{{ row.createdBy }}</span></template>
                <template #cell-validatedBy="{row}"><span class="capitalize">{{ row.validatedBy ?? '—' }}</span></template>
                <template #cell-actions="{row}"><RouterLink class="whitespace-nowrap text-xs font-medium text-emerald-700 hover:underline" :to="'/transport-orders/' + row.no">Voir le détail →</RouterLink></template>
            </UiTable>
            <UiPagination :page="transports.result.page" :limit="transports.result.limit" :total="transports.result.total" :total-pages="transports.result.totalPages"
                :loading="transports.loading" @page="transports.setPage" @limit="transports.setLimit" />
        </UiCard>
        <CreateTransportDialog v-model="createOpen" @created="created" />
    </div>
</template>
