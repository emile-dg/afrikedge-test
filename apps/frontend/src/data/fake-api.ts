import {ApiError} from './api-error'
import type {CreateTransport, PaginatedResponse, Permission, PlanningApi, TransportDetails} from './contracts'
import {createFixtures} from './fixtures'
import {permissions, resolveUser} from './users'
import {todayDate} from '../utils/format'


export function createFakeApi(options: { delay?: number; now?: () => Date } = {}): PlanningApi {
    const now = options.now ?? (() => new Date())
    const data = createFixtures(todayDate(now()))
    const pause = () => new Promise<void>(resolve => setTimeout(resolve, options.delay ?? 160))
    const fail = (status: number, message: string): never => {
        throw new ApiError(status, message)
    }
    const authorize = (id: string, permission: Permission) => {
        const user = resolveUser(id)
        if (!user) return fail(401, 'Utilisateur inconnu.')
        if (!permissions[user.role].includes(permission)) fail(403, 'Vous ne disposez pas de cette autorisation.')
        return user
    }
    const identifier = (value: string) => {
        if (typeof value !== 'string' || !value.trim() || value.trim().length > 20) fail(400, 'Identifiant invalide.')
        return value.trim().toUpperCase()
    }
    const validDate = (value: string) => {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '0001-01-01') return false
        const parsed = new Date(value + 'T12:00:00Z')
        return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
    }
    const transport = (no: string) => data.transports.find(item => item.no === identifier(no)) ?? fail(404, 'Ordre de transport introuvable.')
    const vehicle = (code: string) => data.vehicles.find(item => item.code === identifier(code)) ?? fail(404, 'Véhicule introuvable.')
    const salesOrder = (no: string) => data.salesOrders.find(item => item.no === identifier(no)) ?? fail(404, 'Commande ' + no + ' introuvable.')
    const cents = (value: number) => Math.round(value * 100)
    const details = (no: string): TransportDetails => {
        const header = transport(no)
        const fleet = vehicle(header.vehicleCode)
        const salesOrders = (data.lines[header.no] ?? []).map(salesOrder)
        const totalWeightKg = salesOrders.reduce((sum, order) => sum + cents(order.totalWeightKg), 0) / 100
        return structuredClone({
            ...header, plateNo: fleet.plateNo, capacityKg: fleet.capacityKg, totalWeightKg,
            remainingCapacityKg: (cents(fleet.capacityKg) - cents(totalWeightKg)) / 100, salesOrders,
        })
    }
    const summary = (no: string) => {
        const {
            plateNo: _plateNo,
            capacityKg: _capacityKg,
            remainingCapacityKg: _remaining,
            salesOrders: _sales,
            ...header
        } = details(no)
        return header
    }
    const paginate = <T>(rows: T[], page: number, limit: number): PaginatedResponse<T> => {
        if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100 || (page - 1) * limit > 2147483647) {
            fail(400, 'Pagination invalide.')
        }
        return structuredClone({
            data: rows.slice((page - 1) * limit, page * limit),
            total: rows.length,
            page,
            limit,
            totalPages: Math.ceil(rows.length / limit)
        })
    }
    const draft = (no: string) => {
        const header = transport(no)
        if (header.status !== 0) fail(409, 'Seul un transport en brouillon peut être modifié.')
        return header
    }

    return {
        async listVehicles(userId) {
            await pause()
            authorize(userId, 'vehicles:read')
            return structuredClone(data.vehicles.filter(item => item.active))
        },
        async listSalesOrders(query, userId) {
            await pause()
            authorize(userId, 'sales-orders:read')
            if (query.status !== undefined && ![0, 1, 2].includes(query.status)) fail(400, 'Statut invalide.')
            return paginate(data.salesOrders.filter(order =>
                (query.status === undefined || order.status === query.status) && (!query.city || order.deliveryCity === query.city),
            ).sort((a, b) => a.no.localeCompare(b.no)), query.page, query.limit)
        },
        async listCities(userId) {
            await pause()
            authorize(userId, 'sales-orders:read')
            return [...new Set(data.salesOrders.filter(order => order.status === 0).map(order => order.deliveryCity))].sort((a, b) => a.localeCompare(b, 'fr'))
        },
        async listTransportOrders(query, userId) {
            await pause()
            authorize(userId, 'transport-orders:read')
            if (query.status !== undefined && ![0, 1, 2].includes(query.status)) fail(400, 'Statut invalide.')
            if (query.date && !validDate(query.date)) fail(400, 'Date invalide.')
            return paginate(data.transports.filter(item =>
                (query.status === undefined || item.status === query.status) && (!query.date || item.deliveryDate === query.date),
            ).sort((a, b) => a.no.localeCompare(b.no)).map(item => summary(item.no)), query.page, query.limit)
        },
        async getTransportOrder(no, userId) {
            await pause()
            authorize(userId, 'transport-orders:read')
            return details(no)
        },
        async createTransportOrder(input: CreateTransport, userId) {
            await pause()
            const user = authorize(userId, 'transport-orders:create')
            const fleet = vehicle(input.vehicleCode)
            if (!fleet.active) fail(409, 'Ce véhicule est inactif.')
            if (!validDate(input.deliveryDate) || input.deliveryDate < todayDate(now())) fail(400, 'Choisissez une date valide qui ne soit pas dans le passé.')
            if (data.transports.some(item => item.vehicleCode === fleet.code && item.deliveryDate === input.deliveryDate)) fail(409, 'Ce véhicule est déjà planifié à cette date.')
            const next = Math.max(0, ...data.transports.map(item => Number(item.no.slice(3)))) + 1
            const no = 'TO-' + String(next).padStart(4, '0')
            data.transports.push({
                no,
                vehicleCode: fleet.code,
                deliveryDate: input.deliveryDate,
                status: 0,
                createdBy: user.id,
                validatedBy: null
            })
            data.lines[no] = []
            return details(no)
        },
        async addLines(no, salesOrderNos, userId) {
            await pause()
            authorize(userId, 'transport-orders:lines:add')
            const header = draft(no)
            if (!Array.isArray(salesOrderNos) || !salesOrderNos.length) fail(400, 'Sélectionnez au moins une commande.')
            const ids = salesOrderNos.map(identifier)
            if (new Set(ids).size !== ids.length) fail(400, 'Une commande ne peut être sélectionnée deux fois.')
            const orders = ids.map(salesOrder)
            for (const order of orders) {
                if (order.status !== 0 || Object.values(data.lines).some(lines => lines.includes(order.no))) fail(409, 'La commande ' + order.no + ' est déjà planifiée.')
            }
            const current = details(header.no)
            const combined = cents(current.totalWeightKg) + orders.reduce((sum, order) => sum + cents(order.totalWeightKg), 0)
            if (combined > cents(current.capacityKg)) fail(409, 'La capacité du véhicule serait dépassée.')
            data.lines[header.no] = [...(data.lines[header.no] ?? []), ...ids]
            for (const order of orders) order.status = 1
            return details(header.no)
        },
        async removeLine(no, salesOrderNo, userId) {
            await pause()
            authorize(userId, 'transport-orders:lines:remove')
            const header = draft(no)
            const order = salesOrder(salesOrderNo)
            if (!data.lines[header.no]?.includes(order.no)) fail(404, 'Cette commande ne fait pas partie du transport.')
            data.lines[header.no] = (data.lines[header.no] ?? []).filter(id => id !== order.no)
            order.status = 0
        },
        async validateTransport(no, userId) {
            await pause()
            const user = authorize(userId, 'transport-orders:validate')
            const header = draft(no)
            if (!data.lines[header.no]?.length) fail(409, 'Ajoutez au moins une commande avant de valider.')
            header.status = 1
            header.validatedBy = user.id
            return details(header.no)
        },
        async departTransport(no, userId) {
            await pause()
            authorize(userId, 'transport-orders:depart')
            const header = transport(no)
            if (header.status !== 1) fail(409, 'Seul un transport validé peut être marqué comme parti.')
            const orders = (data.lines[header.no] ?? []).map(salesOrder)
            header.status = 2
            for (const order of orders) order.status = 2
            return details(header.no)
        },
    }
}
