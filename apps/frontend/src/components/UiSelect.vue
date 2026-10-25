<script setup lang="ts">
import {useId} from 'vue'
defineOptions({inheritAttrs: false})
defineProps<{
    label: string; options: readonly {value: string; label: string; disabled?: boolean}[]
    placeholder?: string; error?: string; disabled?: boolean; required?: boolean
}>()
const model = defineModel<string>({default: ''})
const id = useId()
</script>

<template>
    <div class="min-w-0">
        <label :for="id" class="mb-1.5 block text-xs font-medium text-slate-600">{{ label }}<span v-if="required" aria-hidden="true"> *</span></label>
        <div class="relative">
            <select :id="id" v-model="model" v-bind="$attrs" :disabled="disabled" :required="required"
                :aria-invalid="!!error" :aria-describedby="error ? id + '-error' : undefined"
                class="min-h-10 w-full min-w-0 appearance-none rounded-lg border bg-white py-2 pr-9 pl-3 text-sm text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
                :class="error ? 'border-red-400' : 'border-slate-200'">
                <option v-if="placeholder" disabled value="">{{ placeholder }}</option>
                <option v-for="option in options" :key="option.value" :value="option.value" :disabled="option.disabled">{{ option.label }}</option>
            </select>
            <svg class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m5 7 5 5 5-5" /></svg>
        </div>
        <p v-if="error" :id="id + '-error'" class="mt-1 text-xs text-red-600">{{ error }}</p>
    </div>
</template>
