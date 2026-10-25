import type {PaginatedResponse, PaginationQuery, TSalesOrder, TVehicle} from '@shared/types'

export type {PaginatedResponse, PaginationQuery, TSalesOrder, TVehicle}
export type Status = 0 | 1 | 2
export type UserId = 'diane' | 'eric'
export type Permission = 'vehicles:read' | 'sales-orders:read' | 'transport-orders:read' |
    'transport-orders:create' | 'transport-orders:lines:add' | 'transport-orders:lines:remove' |
    'transport-orders:validate' | 'transport-orders:depart'

export interface User {
    id: UserId
    name: string
    role: 'DISPATCHER' | 'LOGISTICS_MANAGER'
    roleLabel: string
}

export interface TransportSummary {
    no: string
    vehicleCode: string
    deliveryDate: string
    status: Status
    createdBy: string
    validatedBy: string | null
    totalWeightKg: number
}

export interface TransportDetails extends TransportSummary {
    plateNo: string
    capacityKg: number
    remainingCapacityKg: number
    salesOrders: TSalesOrder[]
}

export interface SalesQuery extends PaginationQuery {
    status?: Status
}

export interface TransportQuery extends PaginationQuery {
    status?: Status
    date?: string
}

export interface CreateTransport {
    vehicleCode: string
    deliveryDate: string
}
