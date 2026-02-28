<template>
  <div
    class="rounded-xl border-2 transition-all duration-300 overflow-hidden"
    :class="[
      status === 'mapped'
        ? 'border-success bg-green-50 dark:bg-green-900/10'
        : status === 'uploaded'
          ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10'
          : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card'
    ]"
  >
    <!-- Header -->
    <div class="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-dark-border">
      <div class="flex items-center gap-2">
        <div
          :class="[
            'w-6 h-6 rounded-full flex items-center justify-center text-xs',
            status === 'mapped'
              ? 'bg-success text-white'
              : status === 'uploaded'
                ? 'bg-yellow-400 text-white'
                : 'bg-gray-200 dark:bg-dark-border text-gray-500'
          ]"
        >
          <svg v-if="status === 'mapped'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span v-else>{{ index + 1 }}</span>
        </div>
        <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ label }}</h4>
      </div>
      <span
        class="text-xs px-2 py-0.5 rounded-full"
        :class="[
          status === 'mapped' ? 'bg-success/20 text-success' :
          status === 'uploaded' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
          'bg-gray-100 text-gray-500 dark:bg-dark-border dark:text-gray-400'
        ]"
      >
        {{ status === 'mapped' ? 'Ready' : status === 'uploaded' ? 'Needs Mapping' : 'Pending' }}
      </span>
    </div>

    <!-- Body -->
    <div class="p-4">
      <!-- Tab toggle -->
      <div v-if="status === 'pending'" class="flex gap-1 mb-3 bg-gray-100 dark:bg-dark-bg rounded-lg p-0.5">
        <button
          @click="mode = 'file'"
          :class="[
            'flex-1 text-xs py-1.5 rounded-md transition-colors',
            mode === 'file'
              ? 'bg-white dark:bg-dark-card text-gray-800 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          ]"
        >
          File Upload
        </button>
        <button
          @click="mode = 'paste'"
          :class="[
            'flex-1 text-xs py-1.5 rounded-md transition-colors',
            mode === 'paste'
              ? 'bg-white dark:bg-dark-card text-gray-800 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          ]"
        >
          Paste Table
        </button>
      </div>

      <!-- File upload mode -->
      <div v-if="status === 'pending' && mode === 'file'">
        <div
          class="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                 border-gray-300 dark:border-dark-border hover:border-primary dark:hover:border-primary"
          :class="{ 'border-primary bg-blue-50 dark:bg-blue-900/10': dragging }"
          @click="triggerFileInput"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="handleDrop"
        >
          <svg class="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Drop .xlsx file or <span class="text-primary">browse</span>
          </p>
        </div>
        <input ref="fileInput" type="file" accept=".xlsx,.xls" class="hidden" @change="handleFileSelect" />
      </div>

      <!-- Paste mode -->
      <div v-if="status === 'pending' && mode === 'paste'">
        <PasteTable @paste-data="handlePasteData" />
      </div>

      <!-- Loading -->
      <div v-if="uploading" class="flex items-center justify-center py-4">
        <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span class="ml-2 text-sm text-gray-500">Processing...</span>
      </div>

      <!-- Uploaded info -->
      <div v-if="status !== 'pending' && !uploading" class="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>{{ uploadResult?.rowCount || 0 }} rows</p>
        <p v-if="uploadResult?.needsMapping?.length">
          {{ uploadResult.needsMapping.length }} headers need mapping
        </p>
        <button
          @click="resetSlot"
          class="text-primary hover:underline text-xs mt-1"
        >
          Re-upload
        </button>
      </div>

      <!-- Error -->
      <p v-if="error" class="text-xs text-error mt-2">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import PasteTable from './PasteTable.vue';

const props = defineProps({
  sheetType: { type: String, required: true },
  label: { type: String, required: true },
  index: { type: Number, required: true },
  uploadResult: { type: Object, default: null }
});

const emit = defineEmits(['upload-file', 'paste-data', 'reset']);

const mode = ref('file');
const dragging = ref(false);
const uploading = ref(false);
const error = ref('');
const fileInput = ref(null);

const status = computed(() => {
  if (!props.uploadResult) return 'pending';
  if (props.uploadResult.needsMapping?.length > 0) return 'uploaded';
  return 'mapped';
});

function triggerFileInput() {
  fileInput.value?.click();
}

async function handleFileSelect(e) {
  const file = e.target.files?.[0];
  if (file) await uploadFile(file);
}

async function handleDrop(e) {
  dragging.value = false;
  const file = e.dataTransfer.files?.[0];
  if (file) await uploadFile(file);
}

async function uploadFile(file) {
  error.value = '';
  uploading.value = true;
  try {
    await emit('upload-file', { sheetType: props.sheetType, file });
  } catch (err) {
    error.value = err.message || 'Upload failed';
  } finally {
    uploading.value = false;
  }
}

function handlePasteData(rows) {
  error.value = '';
  uploading.value = true;
  try {
    emit('paste-data', { sheetType: props.sheetType, rows });
  } catch (err) {
    error.value = err.message || 'Paste failed';
  } finally {
    uploading.value = false;
  }
}

function resetSlot() {
  error.value = '';
  emit('reset', props.sheetType);
}
</script>
