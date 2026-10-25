<script setup lang="ts">
withDefaults(defineProps<{kind?: 'error' | 'success' | 'info'}>(), {kind: 'error'})
</script>

<template>
    <div :role="kind === 'error' ? 'alert' : 'status'" class="rounded-lg border px-4 py-3 text-sm leading-6"
        :class="kind === 'error' ? 'border-red-200 bg-red-50 text-red-800' : kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-sky-200 bg-sky-50 text-sky-800'">
        <slot />
    </div>
</template>
