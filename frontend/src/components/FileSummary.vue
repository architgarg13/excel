<template>
  <div class="rounded-2xl bg-light-card dark:bg-dark-card shadow-soft p-6 animate-fade-up">
    <div class="flex items-start gap-4">
      <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
        <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
          {{ file.originalName }}
        </h3>
        <div class="mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400">
          <p>Size: {{ formatSize(file.fileSize) }}</p>
          <p>Worksheets: {{ file.worksheets.length }}</p>
          <p>Uploaded: {{ relativeTime(file.uploadedAt) }}</p>
        </div>
      </div>
    </div>
    <button
      class="mt-6 w-full py-2.5 rounded-xl text-sm font-medium
             bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-gray-300
             hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      @click="$emit('reset')"
    >
      Upload Another File
    </button>
  </div>
</template>

<script setup>
defineProps({
  file: {
    type: Object,
    required: true,
  },
});

defineEmits(['reset']);

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + 'm ago';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + 'h ago';
  const days = Math.floor(hours / 24);
  return days + 'd ago';
}
</script>
