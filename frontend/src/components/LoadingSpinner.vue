<template>
  <div class="flex flex-col items-center gap-4">
    <svg class="w-10 h-10 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <div class="w-64">
      <div class="h-2 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden">
        <div
          class="h-full bg-primary rounded-full transition-all duration-300 ease-out"
          :style="{ width: progress + '%' }"
        />
      </div>
    </div>
    <p class="text-sm text-gray-500 dark:text-gray-400 animate-pulse">Uploading...</p>
  </div>
</template>

<script setup>
defineProps({
  progress: {
    type: Number,
    default: 0,
  },
});
</script>
