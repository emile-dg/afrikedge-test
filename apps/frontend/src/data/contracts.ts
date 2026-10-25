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
    city?: string
}

export interface TransportQuery extends PaginationQuery {
    status?: Status
    date?: string
}

export interface CreateTransport {
    vehicleCode: string
    deliveryDate: string
}

export interface PlanningApi {
    listVehicles(userId: string): Promise<TVehicle[]>
    listSalesOrders(query: SalesQuery, userId: string): Promise<PaginatedResponse<TSalesOrder>>
    listCities(userId: string): Promise<string[]>
    listTransportOrders(query: TransportQuery, userId: string): Promise<PaginatedResponse<TransportSummary>>
    getTransportOrder(no: string, userId: string): Promise<TransportDetails>
    createTransportOrder(input: CreateTransport, userId: string): Promise<TransportDetails>
    addLines(no: string, salesOrderNos: string[], userId: string): Promise<TransportDetails>
    removeLine(no: string, salesOrderNo: string, userId: string): Promise<void>
    validateTransport(no: string, userId: string): Promise<TransportDetails>
    departTransport(no: string, userId: string): Promise<TransportDetails>
}
