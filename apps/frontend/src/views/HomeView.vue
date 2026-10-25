<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {RouterLink, useRouter} from 'vue-router'
import {useOverviewStore} from '@/stores/overview'
import {useCurrentUserStore} from '@/stores/current-user'
import {formatDate, weight} from '@/utils/format'
import UiButton from '@/components/UiButton.vue'
import UiCard from '@/components/UiCard.vue'
import UiAlert from '@/components/UiAlert.vue'
import UiTable from '@/components/UiTable.vue'
import UiBadge from '@/components/UiBadge.vue'
import CreateTransportDialog from '@/components/CreateTransportDialog.vue'

const overview = useOverviewStore()
const user = useCurrentUserStore()
const router = useRouter()
const createOpen = ref(false)
const cards = computed(() => [
    {label: 'Commandes à planifier', value: overview.unplanned, to: '/sales-orders', color: 'text-emerald-700'},
    {label: 'Transports en brouillon', value: overview.counts[0] ?? 0, to: '/transport-orders', color: 'text-slate-700'},
    {label: 'Transports validés', value: overview.counts[1] ?? 0, to: '/transport-orders', color: 'text-emerald-700'},
    {label: 'Transports partis', value: overview.counts[2] ?? 0, to: '/transport-orders', color: 'text-sky-700'},
])
const columns = [{key: 'no', label: 'Transport'}, {key: 'vehicleCode', label: 'Véhicule'}, {key: 'deliveryDate', label: 'Livraison'}, {key: 'status', label: 'Statut'}, {key: 'totalWeightKg', label: 'Poids', align: 'right' as const}]
function created(no: string) { void router.push('/transport-orders/' + encodeURIComponent(no)) }
onMounted(() => { void overview.load() })
</script>

<template>
    <div class="space-y-7">
        <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
                <p class="text-[10px] font-semibold tracking-widest text-emerald-700 uppercase">Votre espace de travail</p>
                <h1 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Bonjour {{ user.currentUser.name }}</h1>
                <p class="mt-2 text-sm leading-6 text-slate-500">Une vue d’ensemble pour préparer les prochaines livraisons.</p>
            </div>
            <UiButton v-if="user.can('transport-orders:create')" @click="createOpen = true">+ Nouveau transport</UiButton>
        </div>
        <UiAlert v-if="overview.error">{{ overview.error }} <UiButton variant="ghost" size="sm" @click="overview.load">Réessayer</UiButton></UiAlert>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <RouterLink v-for="card in cards" :key="card.label" :to="card.to" class="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-emerald-400">
                <p class="text-xs leading-5 text-slate-500">{{ card.label }}</p>
                <p class="mt-3 text-3xl font-semibold tracking-tight tabular-nums" :class="card.color">{{ overview.loading ? '…' : overview.error ? '—' : card.value }}</p>
            </RouterLink>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-5">
            <div><h2 class="text-sm font-semibold text-emerald-900">Préparez votre prochaine tournée</h2><p class="mt-1 text-xs leading-6 text-emerald-700">Regroupez les commandes à livrer et choisissez le bon véhicule.</p></div>
            <RouterLink class="text-sm font-medium text-emerald-800 hover:underline" to="/sales-orders">Commandes à planifier →</RouterLink>
        </div>
        <UiCard>
            <template #header>
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <h2 class="text-sm font-semibold">Derniers transports</h2>
                    <RouterLink class="text-xs font-medium text-emerald-700 hover:underline" to="/transport-orders">Tout voir →</RouterLink>
                </div>
            </template>
            <UiTable :rows="overview.recent" :columns="columns" :loading="overview.loading" :error="overview.error" empty-text="Aucun transport créé." label="Derniers transports" @retry="overview.load">
                <template #cell-no="{row}">
                    <RouterLink class="font-medium text-emerald-800 hover:underline" :to="'/transport-orders/' + row.no">{{ row.no }}</RouterLink>
                </template>
                <template #cell-deliveryDate="{row}">
                    <span class="whitespace-nowrap">{{ formatDate(row.deliveryDate) }}</span>
                </template>
                <template #cell-status="{row}">
                    <UiBadge :status="row.status" />
                </template>
                <template #cell-totalWeightKg="{row}">
                    {{ weight(row.totalWeightKg) }}
                </template>
            </UiTable>
        </UiCard>
        <CreateTransportDialog v-model="createOpen" @created="created" />
    </div>
</template>
