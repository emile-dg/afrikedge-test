<script setup lang="ts">
import {onMounted} from 'vue'
import {useVehiclesStore} from '@/stores/vehicles'
import {weight} from '@/utils/format'
import UiCard from '@/components/UiCard.vue'
import UiTable from '@/components/UiTable.vue'
const fleet = useVehiclesStore()
const columns = [{key: 'code', label: 'Véhicule'}, {key: 'plateNo', label: 'Immatriculation'}, {key: 'capacityKg', label: 'Capacité', align: 'right' as const}]
onMounted(() => { void fleet.load() })
</script>

<template>
    <div class="space-y-6">
        <div>
            <p class="text-[10px] font-semibold tracking-widest text-emerald-700 uppercase">Flotte</p>
            <h1 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Véhicules</h1>
            <p class="mt-2 text-sm text-slate-500">Les véhicules actifs disponibles pour vos transports.</p>
        </div>
        <UiCard>
            <UiTable :rows="fleet.vehicles" :columns="columns" row-key="code" :loading="fleet.loading" :error="fleet.error"
                empty-text="Aucun véhicule actif disponible." label="Véhicules actifs" @retry="fleet.load">
                <template #cell-code="{row}"><span class="font-medium text-slate-900">{{ row.code }}</span></template>
                <template #cell-capacityKg="{row}">{{ weight(row.capacityKg) }}</template>
            </UiTable>
        </UiCard>
    </div>
</template>
