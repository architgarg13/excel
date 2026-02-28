<template>
  <div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <SheetUploadSlot
        v-for="(type, i) in sheetOrder"
        :key="type"
        :sheetType="type"
        :label="sheetTypes[type].label"
        :index="i"
        :uploadResult="uploadResults[type] || null"
        @upload-file="$emit('upload-file', $event)"
        @paste-data="$emit('paste-data', $event)"
        @reset="$emit('reset', $event)"
      />
    </div>

    <div class="mt-6 flex items-center justify-between">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ uploadedCount }}/{{ sheetOrder.length }} sheets uploaded
      </p>
      <div
        class="h-2 flex-1 max-w-xs ml-4 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden"
      >
        <div
          class="h-full bg-primary rounded-full transition-all duration-500"
          :style="{ width: `${(uploadedCount / sheetOrder.length) * 100}%` }"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import SheetUploadSlot from './SheetUploadSlot.vue';
import { SHEET_TYPES, SHEET_ORDER } from '../config/sheetConfig.js';

const props = defineProps({
  uploadResults: { type: Object, default: () => ({}) }
});

defineEmits(['upload-file', 'paste-data', 'reset']);

const sheetTypes = SHEET_TYPES;
const sheetOrder = SHEET_ORDER;

const uploadedCount = computed(() =>
  SHEET_ORDER.filter((type) => props.uploadResults[type]).length
);
</script>
