import {computed, ref} from 'vue'
import {defineStore} from 'pinia'
import {permissions, resolveUser, users} from '../data/users'
import type {Permission, UserId} from '../data/contracts'

export const USER_STORAGE_KEY = 'afrikedge.current-user'

export const useCurrentUserStore = defineStore('current-user', () => {
    let restored: UserId = 'diane'
    try {
        const saved = localStorage.getItem(USER_STORAGE_KEY)
        if (saved && resolveUser(saved)) restored = saved as UserId
    } catch {}
    const selectedId = ref<UserId>(restored)
    const currentUser = computed(() => resolveUser(selectedId.value) ?? users[0]!)
    const can = (permission: Permission) => permissions[currentUser.value.role].includes(permission)

    function selectUser(id: string) {
        if (!resolveUser(id)) return
        selectedId.value = id as UserId
        try { localStorage.setItem(USER_STORAGE_KEY, id) } catch {}
    }

    return {selectedId, currentUser, users, can, selectUser}
})
