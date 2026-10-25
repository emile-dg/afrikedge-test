<script setup lang="ts">
import {computed} from 'vue'
import {weight} from '@/utils/format'
const props = defineProps<{used: number; capacity: number}>()
const percentage = computed(() => props.capacity > 0 ? Math.round(props.used / props.capacity * 100) : 0)
const remaining = computed(() => (Math.round(props.capacity * 100) - Math.round(props.used * 100)) / 100)
</script>

<template>
    <div class="space-y-3">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
            <span class="text-sm font-medium text-slate-700">Chargement du véhicule</span>
            <span class="text-sm font-semibold tabular-nums" :class="percentage >= 90 ? 'text-amber-700' : 'text-emerald-700'">{{ percentage }} %</span>
        </div>
        <div role="progressbar" aria-label="Capacité utilisée" :aria-valuenow="Math.min(capacity, Math.max(0, used))" :aria-valuemax="capacity" :aria-valuemin="0" :aria-valuetext="weight(used) + ' sur ' + weight(capacity)"
            class="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div class="h-full rounded-full transition-all" :class="used > capacity ? 'bg-red-500' : percentage >= 90 ? 'bg-amber-500' : 'bg-emerald-600'" :style="{width: Math.min(100, Math.max(0, percentage)) + '%'}" />
        </div>
        <div class="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
            <span>{{ weight(used) }} / {{ weight(capacity) }}</span>
            <span>{{ remaining === 0 ? 'Capacité atteinte' : weight(remaining) + ' disponibles' }}</span>
        </div>
    </div>
</template>
