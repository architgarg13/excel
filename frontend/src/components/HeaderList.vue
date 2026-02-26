<template>
  <div class="flex flex-wrap gap-2 p-4">
    <button
      v-for="(header, index) in headers"
      :key="index"
      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg
             bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300
             hover:bg-blue-100 dark:hover:bg-blue-900/50
             transition-colors cursor-pointer animate-stagger-fade"
      :style="{ animationDelay: index * 50 + 'ms' }"
      @click="copyHeader(header)"
      :title="'Click to copy: ' + header"
    >
      <svg class="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
      </svg>
      {{ header }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  headers: {
    type: Array,
    default: () => [],
  },
});

function copyHeader(text) {
  navigator.clipboard.writeText(text).catch(() => {});
}
</script>
