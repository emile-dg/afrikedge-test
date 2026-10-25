import {ref} from 'vue'
import {useTransportOrdersStore} from '@/stores/transport-orders'
import {useSalesOrdersStore} from '@/stores/sales-orders'
import {useOverviewStore} from '@/stores/overview'
import type {CreateTransport} from '@/data/contracts'

export function useTransportActions() {
    const transports = useTransportOrdersStore()
    const sales = useSalesOrdersStore()
    const overview = useOverviewStore()
    const busy = ref(false)
    async function perform<T>(operation: () => Promise<T | null>, salesChanged = false): Promise<T | null> {
        if (busy.value) return null
        busy.value = true
        try {
            const result = await operation()
            if (result !== null) {
                transports.invalidate()
                overview.invalidate()
                if (salesChanged) sales.invalidate()
            }
            return result
        } finally { busy.value = false }
    }
    const create = (input: CreateTransport) => perform(() => transports.create(input))
    const addLines = (no: string, ids: string[]) => perform(() => transports.addLines(no, ids), true)
    const validate = (no: string) => perform(() => transports.validate(no))
    const depart = (no: string) => perform(() => transports.depart(no), true)
    const removeLine = (no: string, salesOrderNo: string) => perform(async () => {
        const result = await transports.removeLine(no, salesOrderNo)
        if (result) await transports.loadDetail(no)
        return result
    }, true)
    return {busy, create, addLines, removeLine, validate, depart}
}
