<script setup lang="ts">
import {RouterLink} from 'vue-router'
</script>

<template>
    <div class="rounded-xl border border-slate-200 bg-white p-8">
        <p class="text-sm font-medium text-emerald-700">404</p>
        <h1 class="mt-3 text-2xl font-semibold">Page introuvable</h1>
        <p class="mt-3 text-sm text-slate-500">Cette page n’existe pas.</p>
        <RouterLink class="mt-6 inline-flex text-sm font-medium text-emerald-700 hover:underline" to="/">Retour à l’accueil →</RouterLink>
    </div>
</template>
