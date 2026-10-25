<script setup lang="ts">
import {computed} from 'vue'

const props = withDefaults(defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md'
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
}>(), {variant: 'primary', size: 'md', type: 'button'})
const variants = {
    primary: 'border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800',
    secondary: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    ghost: 'border-transparent text-slate-600 hover:bg-slate-100',
    danger: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
}
const classes = computed(() => [variants[props.variant], props.size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'])
</script>

<template>
    <button :type="type" :disabled="disabled || loading" :aria-busy="loading || undefined"
        class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        :class="classes">
        <span v-if="loading" class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
        <slot />
    </button>
</template>
