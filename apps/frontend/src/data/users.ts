import type {Permission, User} from './contracts'

export const users: readonly User[] = [
    {id: 'diane', name: 'Diane', role: 'DISPATCHER', roleLabel: 'Dispatcher'},
    {id: 'eric', name: 'Eric', role: 'LOGISTICS_MANAGER', roleLabel: 'Responsable logistique'},
]

const dispatcherPermissions: readonly Permission[] = [
    'vehicles:read', 'sales-orders:read', 'transport-orders:read', 'transport-orders:create',
    'transport-orders:lines:add', 'transport-orders:lines:remove', 'transport-orders:depart',
]

export const permissions: Readonly<Record<User['role'], readonly Permission[]>> = {
    DISPATCHER: dispatcherPermissions,
    LOGISTICS_MANAGER: [...dispatcherPermissions, 'transport-orders:validate'],
}

export function resolveUser(id: string) {
    return users.find(user => user.id === id)
}
