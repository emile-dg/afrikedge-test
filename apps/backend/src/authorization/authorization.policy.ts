import {Permission, Role} from './authorization.types';
import type {ResolvedUser} from './authorization.types';

export const users: ReadonlyMap<string, ResolvedUser> = new Map<string, ResolvedUser>([
    ['diane', Object.freeze({id: 'diane', role: Role.Dispatcher})],
    ['eric', Object.freeze({id: 'eric', role: Role.LogisticsManager})],
]);

const dispatcherPermissions: ReadonlySet<Permission> = new Set([
    Permission.VehiclesRead,
    Permission.SalesOrdersRead,
    Permission.TransportOrdersRead,
    Permission.TransportOrdersCreate,
    Permission.TransportOrdersLinesAdd,
    Permission.TransportOrdersLinesRemove,
    Permission.TransportOrdersDepart,
]);

export const rolePermissions: Readonly<Record<Role, ReadonlySet<Permission>>> = {
    [Role.Dispatcher]: dispatcherPermissions,
    [Role.LogisticsManager]: new Set([...dispatcherPermissions, Permission.TransportOrdersValidate]),
};
