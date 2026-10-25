<script setup lang="ts">
import {onMounted} from 'vue'
import {useSalesOrdersStore} from '@/stores/sales-orders'
import {weight} from '@/utils/format'
import UiButton from './UiButton.vue'
import UiCard from './UiCard.vue'
import UiSelect from './UiSelect.vue'
import UiTable from './UiTable.vue'
import UiPagination from './UiPagination.vue'

const sales = useSalesOrdersStore()
const columns = [
    {key: 'no', label: 'Commande'},
    {key: 'customerName', label: 'Client'},
    {key: 'deliveryCity', label: 'Ville de livraison'},
    {key: 'totalWeightKg', label: 'Poids', align: 'right' as const},
]
onMounted(() => {
    void sales.load()
})
</script>

<template>
    <div class="min-w-0 space-y-4">
        <div class="flex flex-wrap items-end gap-3">
            <UiSelect class="w-full sm:w-64" label="Ville de livraison" :model-value="sales.query.city ?? ''"
                      :options="[{value: '', label: 'Toutes les villes'}, ...sales.cities.map(city => ({value: city, label: city}))]"
                      @update:model-value="sales.setCity"/>
            <UiButton variant="ghost" size="sm" :disabled="!sales.query.city" @click="sales.setCity('')">Réinitialiser
                les filtres
            </UiButton>
        </div>
        <div
            class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div>
                <p class="text-sm font-medium text-emerald-900">{{ sales.selection.length }}
                    commande{{ sales.selection.length > 1 ? 's' : '' }}
                    sélectionnée{{ sales.selection.length > 1 ? 's' : '' }}</p>
                <p class="mt-1 text-xs text-emerald-700">Poids total : {{ weight(sales.selectedWeight) }}</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
                <UiButton variant="ghost" size="sm" :disabled="!sales.selection.length" @click="sales.clearSelection">
                    Effacer la sélection
                </UiButton>
                <slot name="actions"/>
            </div>
        </div>

        <UiCard>
            <UiTable :rows="sales.result.data" :columns="columns" selectable :selected="sales.selectedIds"
                     :loading="sales.loading" :error="sales.error"
                     empty-text="Aucune commande à planifier pour cette ville."
                     label="Commandes à planifier" @update:selected="sales.select" @retry="sales.load">
                <template #cell-no="{row}"><span class="font-medium text-slate-900">{{ row.no }}</span></template>
                <template #cell-customerName="{row}">
                    <span class="block whitespace-nowrap text-slate-700">{{ row.customerName }}</span>
                    <span class="mt-1 block text-xs text-slate-400">{{ row.customerNo }}</span>
                </template>
                <template #cell-totalWeightKg="{row}">{{ weight(row.totalWeightKg) }}</template>
            </UiTable>
            <UiPagination :page="sales.result.page" :limit="sales.result.limit" :total="sales.result.total"
                          :total-pages="sales.result.totalPages"
                          :loading="sales.loading" @page="sales.setPage" @limit="sales.setLimit"/>
        </UiCard>
    </div>
</template>
