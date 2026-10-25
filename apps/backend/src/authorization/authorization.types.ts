import type {Request} from 'express';

export enum Role {
    Dispatcher = 'DISPATCHER',
    LogisticsManager = 'LOGISTICS_MANAGER',
}

export enum Permission {
    VehiclesRead = 'vehicles:read',

    SalesOrdersRead = 'sales-orders:read',

    TransportOrdersRead = 'transport-orders:read',
    TransportOrdersCreate = 'transport-orders:create',
    TransportOrdersDepart = 'transport-orders:depart',
    TransportOrdersValidate = 'transport-orders:validate',
    TransportOrdersLinesAdd = 'transport-orders:lines:add',
    TransportOrdersLinesRemove = 'transport-orders:lines:remove',
}

export interface ResolvedUser {
    readonly id: string;
    readonly role: Role;
}

export interface AuthorizedRequest extends Request {
    currentUser?: ResolvedUser;
}

export const PERMISSION_METADATA = 'afrikedge:permission';
