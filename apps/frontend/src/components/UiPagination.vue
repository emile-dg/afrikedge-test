<script setup lang="ts">
import {computed} from 'vue'
import UiButton from './UiButton.vue'
import UiSelect from './UiSelect.vue'
const props = defineProps<{page: number; limit: number; total: number; totalPages: number; loading?: boolean}>()
const emit = defineEmits<{page: [value: number]; limit: [value: number]}>()
const options = [10, 25, 50, 100].map(size => ({value: String(size), label: String(size)}))
const start = computed(() => props.total ? (props.page - 1) * props.limit + 1 : 0)
</script>

<template>
    <div class="flex flex-wrap items-end justify-between gap-4 border-t border-slate-100 px-5 py-4">
        <p class="pb-2 text-xs text-slate-500">{{ start }}–{{ Math.min(page * limit, total) }} sur {{ total }} résultat{{ total > 1 ? 's' : '' }}</p>
        <div class="flex flex-wrap items-end gap-3">
            <UiSelect class="w-24" label="Par page" :model-value="String(limit)" :options="options" :disabled="loading" @update:model-value="emit('limit', Number($event))" />
            <div class="flex items-center gap-2 pb-0.5">
                <UiButton size="sm" variant="secondary" :disabled="loading || page <= 1" aria-label="Page précédente" @click="emit('page', page - 1)">←</UiButton>
                <span class="whitespace-nowrap text-xs text-slate-500">{{ page }} / {{ Math.max(1, totalPages) }}</span>
                <UiButton size="sm" variant="secondary" :disabled="loading || page >= totalPages" aria-label="Page suivante" @click="emit('page', page + 1)">→</UiButton>
            </div>
        </div>
    </div>
</template>
