<script setup lang="ts">
import {ref} from 'vue'
import {RouterLink} from 'vue-router'
import {useSalesOrdersStore} from '@/stores/sales-orders'
import {useCurrentUserStore} from '@/stores/current-user'
import UiButton from '@/components/UiButton.vue'
import UiAlert from '@/components/UiAlert.vue'
import SalesSelection from '@/components/SalesSelection.vue'
import AssignTransportDialog from '@/components/AssignTransportDialog.vue'

const sales = useSalesOrdersStore()
const user = useCurrentUserStore()
const salesSelection = ref<InstanceType<typeof SalesSelection>>()
const assignOpen = ref(false)
const assignedNo = ref('')

function assigned(no: string) {
    assignedNo.value = no
    sales.clearSelection()
    void salesSelection.value?.reload()
}
</script>

<template>
    <div class="space-y-6">
        <div>
            <p class="text-[10px] font-semibold tracking-widest text-emerald-700 uppercase">Planification</p>
            <h1 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Commandes à planifier</h1>
            <p class="mt-2 text-sm leading-6 text-slate-500">
                Sélectionnez les commandes à regrouper dans un transport.
            </p>
        </div>

        <UiAlert v-if="assignedNo" kind="success">Les commandes ont été ajoutées à
            <RouterLink class="font-semibold underline" :to="'/transport-orders/' + assignedNo">
                {{ assignedNo }}
            </RouterLink>
            .
        </UiAlert>

        <SalesSelection ref="salesSelection">
            <template #actions>
                <UiButton v-if="user.can('transport-orders:lines:add')" :disabled="sales.loading || !!sales.error || !sales.selection.length"
                          @click="assignOpen = true">Ajouter à un transport
                </UiButton>
            </template>
        </SalesSelection>

        <AssignTransportDialog v-model="assignOpen" :orders="sales.selection" @assigned="assigned"/>
    </div>
</template>
