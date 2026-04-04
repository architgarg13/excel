<template>
  <nav class="sticky top-0 z-50 h-16 glass border-b border-gray-200/50 dark:border-dark-border/50 shadow-sm">
    <div class="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-md shadow-primary/20">
          <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
        </div>
        <div>
          <span class="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Excel Insight</span>
          <span class="hidden sm:inline text-xs text-gray-400 dark:text-gray-500 ml-2">by mastree.co.in</span>
        </div>
      </div>
      <button
        @click="$emit('toggle-dark')"
        class="relative w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-border/60 transition-all duration-300 group"
        aria-label="Toggle dark mode"
      >
        <svg
          v-if="!isDark"
          class="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-all duration-300 group-hover:rotate-12"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <svg
          v-else
          class="w-5 h-5 text-yellow-400 group-hover:text-yellow-300 transition-all duration-300 group-hover:rotate-45"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </button>
    </div>
  </nav>
</template>

<script setup>
defineProps({
  isDark: Boolean,
});

defineEmits(['toggle-dark']);
</script>
