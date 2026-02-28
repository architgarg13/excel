<template>
  <div>
    <textarea
      ref="textareaRef"
      v-model="pasteText"
      class="w-full h-32 p-3 text-sm font-mono border rounded-lg resize-none
             bg-white dark:bg-dark-bg border-gray-300 dark:border-dark-border
             text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500
             focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
      placeholder="Paste tab-separated data from Excel or Google Sheets here..."
      @paste="handlePaste"
    />
    <div class="flex items-center justify-between mt-2">
      <span class="text-xs text-gray-400">
        {{ rowCount > 0 ? `${rowCount} rows detected` : 'Paste data with headers in first row' }}
      </span>
      <button
        v-if="parsedRows.length > 0"
        @click="submitPaste"
        class="px-4 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-blue-700 transition-colors"
      >
        Use This Data
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const emit = defineEmits(['paste-data']);

const pasteText = ref('');
const parsedRows = ref([]);

const rowCount = computed(() => Math.max(0, parsedRows.value.length - 1));

function handlePaste() {
  // Defer parsing to next tick so v-model updates
  setTimeout(() => {
    parseText();
  }, 0);
}

function parseText() {
  const text = pasteText.value.trim();
  if (!text) {
    parsedRows.value = [];
    return;
  }

  const lines = text.split('\n').filter((l) => l.trim());
  parsedRows.value = lines.map((line) => line.split('\t'));
}

function submitPaste() {
  if (parsedRows.value.length > 0) {
    emit('paste-data', parsedRows.value);
  }
}
</script>
