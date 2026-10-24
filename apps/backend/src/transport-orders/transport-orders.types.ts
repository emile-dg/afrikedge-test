import type {PaginationQuery} from '@shared/types';

export enum TransportOrderStatus {
    Draft = 0,
    Validated = 1,
    Departed = 2,
}

export interface TransportOrderSummary {
    no: string;
    vehicleCode: string;
    deliveryDate: string;
    status: TransportOrderStatus;
    createdBy: string;
    validatedBy: string | null;
    totalWeightKg: number;
}

export interface TransportSalesOrder {
    no: string;
    customerNo: string;
    customerName: string;
    deliveryCity: string;
    totalWeightKg: number;
    status: number;
}

export interface TransportOrderDetails extends TransportOrderSummary {
    plateNo: string;
    capacityKg: number;
    remainingCapacityKg: number;
    salesOrders: TransportSalesOrder[];
}

export interface TransportOrderQuery extends PaginationQuery {
    status?: number;
    date?: string;
}

export interface CreateTransportOrder {
    vehicleCode: string;
    deliveryDate: string;
}
