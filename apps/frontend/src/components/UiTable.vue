<script setup lang="ts" generic="T extends object">
import {computed} from 'vue'
import UiButton from './UiButton.vue'

const props = withDefaults(defineProps<{
    rows: T[]
    columns: { key: string; label: string; align?: 'right' }[]
    rowKey?: string
    selectable?: boolean
    selected?: string[]
    loading?: boolean
    error?: string
    emptyText?: string
    label?: string
}>(), {rowKey: 'no', selected: () => [], emptyText: 'Aucun résultat.', label: 'Résultats'})
const emit = defineEmits<{ 'update:selected': [value: string[]]; retry: [] }>()
const cell = (row: T, key: string): unknown => Reflect.get(row, key)
const keyOf = (row: T) => String(cell(row, props.rowKey))
const allSelected = computed(() => props.rows.length > 0 && props.rows.every(row => props.selected.includes(keyOf(row))))
const someSelected = computed(() => !allSelected.value && props.rows.some(row => props.selected.includes(keyOf(row))))

function toggle(no: string, selected: boolean) {
    emit('update:selected', selected ? [...new Set([...props.selected, no])] : props.selected.filter(id => id !== no))
}

function selectPage(selected: boolean) {
    const ids = props.rows.map(keyOf)
    emit('update:selected', selected ? [...new Set([...props.selected, ...ids])] : props.selected.filter(id => !ids.includes(id)))
}
</script>

<template>
    <div class="min-w-0">
        <div v-if="loading" role="status" class="px-5 py-12 text-center text-sm text-slate-500">Chargement…</div>
        <div v-else-if="error" role="alert" class="space-y-3 px-5 py-10 text-center">
            <p class="text-sm text-red-700">{{ error }}</p>
            <UiButton variant="secondary" size="sm" @click="emit('retry')">Réessayer</UiButton>
        </div>
        <div v-else-if="!rows.length" class="px-5 py-12 text-center text-sm text-slate-500">{{ emptyText }}</div>
        <div v-else class="max-w-full overflow-x-auto">
            <table class="w-full min-w-[38rem] border-collapse text-left text-sm" :aria-label="label">
                <thead class="border-b border-slate-200 bg-slate-50/80 text-xs text-slate-500">
                <tr>
                    <th v-if="selectable" scope="col" class="w-12 px-5 py-3.5">
                        <input type="checkbox" class="size-4 accent-emerald-700" aria-label="Sélectionner cette page"
                               :checked="allSelected" :indeterminate="someSelected"
                               @change="selectPage(($event.target as HTMLInputElement).checked)"/>
                    </th>
                    <th v-for="column in columns" :key="column.key" scope="col"
                        class="whitespace-nowrap px-5 py-3.5 font-medium"
                        :class="column.align === 'right' ? 'text-right' : ''">{{ column.label }}
                    </th>
                </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                <tr v-for="row in rows" :key="keyOf(row)" class="transition-colors hover:bg-slate-50/70"
                    :class="selected.includes(keyOf(row)) ? 'bg-emerald-50/40' : ''">
                    <td v-if="selectable" class="px-5 py-4">
                        <input type="checkbox" class="size-4 accent-emerald-700"
                               :aria-label="'Sélectionner ' + keyOf(row)"
                               :checked="selected.includes(keyOf(row))"
                               @change="toggle(keyOf(row), ($event.target as HTMLInputElement).checked)"/>
                    </td>
                    <td v-for="column in columns" :key="column.key" class="px-5 py-4 text-slate-600"
                        :class="column.align === 'right' ? 'text-right tabular-nums' : ''"
                    >
                        <slot :name="'cell-' + column.key" :row="row" :value="cell(row, column.key)">
                            {{ cell(row, column.key) ?? '—' }}
                        </slot>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
