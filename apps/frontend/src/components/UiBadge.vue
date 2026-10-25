<script setup lang="ts">
import {computed} from 'vue'
import {salesLabels, transportLabels} from '@/utils/format'
const props = withDefaults(defineProps<{status: number; kind?: 'transport' | 'sales'}>(), {kind: 'transport'})
const label = computed(() => (props.kind === 'sales' ? salesLabels : transportLabels)[props.status] ?? 'Inconnu')
const colors = ['bg-slate-100 text-slate-600', 'bg-emerald-50 text-emerald-700', 'bg-sky-50 text-sky-700']
</script>

<template>
    <span class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium" :class="colors[status]">
        <span class="size-1.5 rounded-full bg-current" aria-hidden="true" />{{ label }}
    </span>
</template>
