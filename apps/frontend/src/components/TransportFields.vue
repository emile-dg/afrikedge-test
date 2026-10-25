<script setup lang="ts">
import {computed} from 'vue'
import type {CreateTransport} from '@/data/contracts'
import {useVehicleData} from '@/composables/useVehicleData'
import {useVehiclesStore} from '@/stores/vehicles'
import {todayDate, weight} from '@/utils/format'
import UiSelect from './UiSelect.vue'
import UiInput from './UiInput.vue'
import UiAlert from './UiAlert.vue'
import UiButton from './UiButton.vue'

defineProps<{disabled?: boolean}>()
const model = defineModel<CreateTransport>({required: true})
const vehicles = useVehiclesStore()
const code = computed({get: () => model.value.vehicleCode, set: value => { model.value = {...model.value, vehicleCode: value} }})
const date = computed({get: () => model.value.deliveryDate, set: value => { model.value = {...model.value, deliveryDate: value} }})
const fleet = computed(() => vehicles.vehicles.find(item => item.code === code.value))
const {reload} = useVehicleData()
</script>

<template>
    <div class="space-y-4">
        <UiAlert v-if="vehicles.error">{{ vehicles.error }} <UiButton variant="ghost" size="sm" @click="reload">Réessayer</UiButton></UiAlert>
        <UiSelect v-model="code" label="Véhicule" placeholder="Choisir un véhicule" required :disabled="disabled || vehicles.loading"
            :options="vehicles.vehicles.map(item => ({value: item.code, label: item.code + ' · ' + item.plateNo + ' · ' + weight(item.capacityKg)}))" />
        <UiInput v-model="date" label="Date de livraison" type="date" required :min="todayDate()" :disabled="disabled" />
        <p v-if="fleet" class="text-xs text-slate-500">Capacité disponible : <strong class="font-medium text-slate-700">{{ weight(fleet.capacityKg) }}</strong></p>
    </div>
</template>
