<script setup lang="ts">
import {ref, watch} from 'vue'
import {RouterLink, RouterView, useRoute} from 'vue-router'
import UiButton from '@/components/UiButton.vue'
import UiSelect from '@/components/UiSelect.vue'
import {useCurrentUserStore} from '@/stores/current-user'

const route = useRoute()
const user = useCurrentUserStore()
const sidebarOpen = ref(false)
const navigation = [
    {to: '/', label: 'Accueil', icon: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z'},
    {to: '/sales-orders', label: 'Commandes à planifier', icon: 'M6 3h12v18H6z M9 8h6 M9 12h6 M9 16h4'},
    {to: '/transport-orders', label: 'Ordres de transport', icon: 'M3 6h12v12H3z M15 10h3l3 4v4h-6 M5 18a2 2 0 1 0 4 0 M16 18a2 2 0 1 0 4 0'},
    {to: '/vehicles', label: 'Véhicules', icon: 'M5 17H3v-6l2-6h14l2 6v6h-2 M5 17h14 M5 11h14 M7 14h.01 M17 14h.01 M5 17v3 M19 17v3'},
]
const options = user.users.map(item => ({value: item.id, label: item.name + ' · ' + item.roleLabel}))
const isActive = (to: string) => to === '/' ? route.path === '/' : route.path.startsWith(to)
watch(() => route.fullPath, () => { sidebarOpen.value = false })
</script>

<template>
    <div class="flex h-dvh flex-col overflow-hidden lg:flex-row" @keydown.esc="sidebarOpen = false">
        <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3">Aller au contenu</a>
        <div class="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-3 lg:hidden">
            <RouterLink to="/" class="font-semibold tracking-tight text-emerald-800">AfrikEdge</RouterLink>
            <UiButton variant="ghost" size="sm" aria-controls="app-sidebar" :aria-expanded="sidebarOpen" @click="sidebarOpen = !sidebarOpen">
                {{ sidebarOpen ? 'Fermer' : 'Menu' }}
                <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </UiButton>
        </div>

        <aside id="app-sidebar" class="max-h-[40dvh] w-full shrink-0 flex-col overflow-y-auto border-b border-slate-200 bg-white lg:h-full lg:max-h-none lg:w-64 lg:border-r lg:border-b-0" :class="sidebarOpen ? 'flex' : 'hidden lg:flex'">
            <RouterLink to="/" class="hidden min-h-24 shrink-0 items-center gap-3 border-b border-slate-100 px-6 lg:flex">
                <span class="flex size-10 items-center justify-center rounded-xl bg-emerald-700 text-sm font-bold text-white">AE</span>
                <span><span class="block font-semibold tracking-tight">AfrikEdge</span><span class="mt-1 block text-[11px] text-slate-400">Planification des transports</span></span>
            </RouterLink>
            <nav aria-label="Navigation principale" class="flex-1 space-y-1.5 p-4 lg:py-7">
                <p class="mb-4 px-3 text-[10px] font-semibold tracking-widest text-slate-400 uppercase">Espace de travail</p>
                <RouterLink v-for="item in navigation" :key="item.to" :to="item.to"
                    class="flex items-center gap-3 rounded-lg px-3 py-3 text-xs font-medium transition-colors"
                    :class="isActive(item.to) ? 'bg-emerald-50 text-emerald-800' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'"
                    :aria-current="isActive(item.to) ? 'page' : undefined" @click="sidebarOpen = false">
                    <svg class="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="item.icon" /></svg>
                    {{ item.label }}
                </RouterLink>
            </nav>
            <div class="hidden p-5 lg:block">
                <div class="rounded-xl bg-slate-50 p-4">
                    <p class="text-xs font-medium text-slate-600">Chaque livraison compte.</p>
                    <p class="mt-2 text-[11px] leading-5 text-slate-400">Vos commandes, votre flotte et vos transports réunis.</p>
                </div>
                <p class="mt-5 text-[10px] text-slate-400">AfrikEdge · SEFS1026</p>
            </div>
        </aside>

        <div class="flex min-h-0 min-w-0 flex-1 flex-col">
            <header class="flex min-h-24 shrink-0 flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
                <div class="min-w-0">
                    <p class="text-sm font-semibold">{{ route.meta.title }}</p>
                    <p class="mt-1 text-[11px] text-slate-400">Planification des transports</p>
                </div>
                <UiSelect class="w-full sm:w-64" label="Utilisateur" :model-value="user.selectedId" :options="options" @update:model-value="user.selectUser" />
            </header>
            <main id="main-content" class="min-h-0 min-w-0 flex-1 overflow-y-auto" tabindex="-1">
                <div class="mx-auto w-full max-w-7xl min-w-0 px-4 py-7 sm:px-8 sm:py-9"><RouterView /></div>
            </main>
        </div>
    </div>
</template>
