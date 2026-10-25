import {nextTick} from 'vue'
import {createRouter, createWebHistory} from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [{
        path: '/',
        component: AppLayout,
        children: [
            {path: '', name: 'home', component: HomeView, meta: {title: 'Accueil'}},
            {path: 'sales-orders', name: 'sales-orders', component: () => import('@/views/SalesOrdersView.vue'), meta: {title: 'Commandes à planifier'}},
            {path: 'transport-orders', name: 'transport-orders', component: () => import('@/views/TransportOrdersView.vue'), meta: {title: 'Ordres de transport'}},
            {path: 'transport-orders/:no', name: 'transport-detail', component: () => import('@/views/TransportDetailView.vue'), meta: {title: 'Détail du transport'}},
            {path: 'vehicles', name: 'vehicles', component: () => import('@/views/VehiclesView.vue'), meta: {title: 'Véhicules'}},
            {path: ':pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue'), meta: {title: 'Page introuvable'}},
        ],
    }],
    scrollBehavior: async (to) => {
        await nextTick()
        const main = document.getElementById('main-content')
        if (to.hash) document.getElementById(to.hash.slice(1))?.scrollIntoView()
        else main?.scrollTo({top: 0, left: 0})
        return false as const
    },
})
router.afterEach(to => { document.title = String(to.meta.title ?? 'Accueil') + ' · AfrikEdge' })
export default router
