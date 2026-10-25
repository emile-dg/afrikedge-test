<script setup lang="ts">
import {useId} from 'vue'
defineOptions({inheritAttrs: false})
const props = withDefaults(defineProps<{
    label: string; type?: 'text' | 'date'; error?: string; help?: string; disabled?: boolean; required?: boolean
}>(), {type: 'text'})
const model = defineModel<string>({default: ''})
const id = useId()
</script>

<template>
    <div class="min-w-0">
        <label :for="id" class="mb-1.5 block text-xs font-medium text-slate-600">{{ label }}<span v-if="required" aria-hidden="true"> *</span></label>
        <input :id="id" v-model="model" v-bind="$attrs" :type="props.type" :disabled="disabled" :required="required"
            :aria-invalid="!!error" :aria-describedby="error || help ? id + '-help' : undefined"
            class="min-h-10 w-full min-w-0 rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
            :class="error ? 'border-red-400' : 'border-slate-200'" />
        <p v-if="error || help" :id="id + '-help'" class="mt-1 text-xs" :class="error ? 'text-red-600' : 'text-slate-500'">{{ error || help }}</p>
    </div>
</template>
