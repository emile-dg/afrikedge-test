<template>
    <section class="min-w-0 rounded-xl border border-slate-200 bg-white">
        <header v-if="$slots.header" class="border-b border-slate-100 px-5 py-4"><slot name="header" /></header>
        <slot />
        <footer v-if="$slots.footer" class="border-t border-slate-100 px-5 py-4"><slot name="footer" /></footer>
    </section>
</template>
