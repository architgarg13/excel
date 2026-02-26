<template>
  <div
    class="w-full max-w-lg mx-auto rounded-2xl bg-light-card dark:bg-dark-card shadow-soft
           border-2 border-dashed transition-all duration-300"
    :class="{
      'border-gray-300 dark:border-dark-border': state === 'idle',
      'border-primary drag-glow': state === 'dragging',
      'border-primary': state === 'uploading',
      'border-success': state === 'success',
      'border-error': state === 'error',
    }"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <div class="p-8 flex flex-col items-center gap-4 text-center">
      <!-- Idle / Dragging state -->
      <template v-if="state === 'idle' || state === 'dragging'">
        <svg class="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <div>
          <p class="text-lg font-semibold text-gray-700 dark:text-gray-200">
            Drag & drop your Excel file here
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            or
            <button
              class="text-primary hover:underline font-medium"
              @click="openFilePicker"
            >
              browse files
            </button>
          </p>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">.xlsx or .xls &bull; Max 10MB</p>
        </div>
      </template>

      <!-- Uploading state -->
      <template v-if="state === 'uploading'">
        <LoadingSpinner :progress="progress" />
      </template>

      <!-- Success state -->
      <template v-if="state === 'success'">
        <div class="animate-check-pop">
          <svg class="w-16 h-16 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-lg font-semibold text-success">File processed successfully!</p>
      </template>

      <!-- Error state -->
      <template v-if="state === 'error'">
        <svg class="w-16 h-16 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-lg font-semibold text-error">{{ errorMessage }}</p>
        <button
          class="px-4 py-2 text-sm rounded-lg bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          @click="reset"
        >
          Try Again
        </button>
      </template>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept=".xlsx,.xls"
      class="hidden"
      @change="onFileSelected"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { uploadFile } from '../services/api.js';
import LoadingSpinner from './LoadingSpinner.vue';

const emit = defineEmits(['upload-success']);

const fileInput = ref(null);
const state = ref('idle'); // idle | dragging | uploading | success | error
const progress = ref(0);
const errorMessage = ref('');

function openFilePicker() {
  fileInput.value.click();
}

function onDragOver() {
  if (state.value === 'idle') {
    state.value = 'dragging';
  }
}

function onDragLeave() {
  if (state.value === 'dragging') {
    state.value = 'idle';
  }
}

function onDrop(e) {
  state.value = 'idle';
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
}

function onFileSelected(e) {
  const file = e.target.files[0];
  if (file) handleFile(file);
  e.target.value = '';
}

function validateFile(file) {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  const validExts = ['.xlsx', '.xls'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();

  if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
    return 'Invalid file type. Only .xlsx and .xls files are allowed.';
  }
  if (file.size > 10 * 1024 * 1024) {
    return 'File too large. Maximum size is 10MB.';
  }
  return null;
}

async function handleFile(file) {
  const validationError = validateFile(file);
  if (validationError) {
    errorMessage.value = validationError;
    state.value = 'error';
    return;
  }

  state.value = 'uploading';
  progress.value = 0;

  try {
    const response = await uploadFile(file, (p) => {
      progress.value = p;
    });
    state.value = 'success';
    setTimeout(() => {
      emit('upload-success', response.data.data);
    }, 800);
  } catch (err) {
    errorMessage.value =
      err.response?.data?.error || 'Upload failed. Please try again.';
    state.value = 'error';
  }
}

function reset() {
  state.value = 'idle';
  progress.value = 0;
  errorMessage.value = '';
}
</script>
