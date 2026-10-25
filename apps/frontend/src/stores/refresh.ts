import {ref} from 'vue'

export const dataRevision = ref(0)
export function dataChanged() { dataRevision.value++ }
