<script setup lang="ts">
import {onMounted, onBeforeUnmount, ref, useId, watch} from 'vue'
import UiButton from './UiButton.vue'
const props = defineProps<{title: string; busy?: boolean; wide?: boolean}>()
const open = defineModel<boolean>({default: false})
const dialog = ref<HTMLDialogElement>()
const titleId = useId()
let previousFocus: HTMLElement | null = null
function sync() {
    if (open.value && dialog.value && !dialog.value.open) {
        previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
        dialog.value.showModal()
    } else if (!open.value && dialog.value?.open) {
        dialog.value.close()
        previousFocus?.focus()
    }
}
function close() { if (!props.busy) open.value = false }
watch(open, sync)
onMounted(sync)
onBeforeUnmount(() => { dialog.value?.close(); previousFocus?.focus() })
</script>

<template>
    <dialog ref="dialog" :aria-labelledby="titleId" class="m-auto max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 shadow-xl backdrop:bg-slate-950/40"
        :class="wide ? 'max-w-5xl' : 'max-w-xl'" @cancel.prevent="close" @click.self="close" @close="open = false">
        <div class="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <h2 :id="titleId" class="text-lg font-semibold">{{ title }}</h2>
            <UiButton variant="ghost" size="sm" :disabled="busy" aria-label="Fermer la fenêtre" @click="close">✕</UiButton>
        </div>
        <div class="space-y-5 p-5"><slot /></div>
        <footer v-if="$slots.footer" class="flex flex-wrap justify-end gap-3 border-t border-slate-100 px-5 py-4"><slot name="footer" /></footer>
    </dialog>
</template>
