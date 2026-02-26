<template>
  <div class="space-y-3">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Worksheets</h2>
    <WorksheetItem
      v-for="(ws, index) in worksheets"
      :key="ws.name"
      :worksheet="ws"
      class="animate-bounce-in"
      :style="{ animationDelay: index * 100 + 'ms' }"
    />
  </div>
</template>

<script setup>
import WorksheetItem from './WorksheetItem.vue';

defineProps({
  worksheets: {
    type: Array,
    default: () => [],
  },
});
</script>
