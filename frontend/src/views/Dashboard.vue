<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Stepper -->
    <Stepper :steps="['Upload Sheets', 'Map Headers', 'Generate Output']" :currentStep="currentStep" />

    <!-- Phase 1: Upload Sheets -->
    <div v-if="currentStep === 0">
      <SheetUploadGrid
        :uploadResults="uploadResults"
        @upload-file="handleUploadFile"
        @paste-data="handlePasteData"
        @reset="handleReset"
      />

      <div class="mt-6 flex justify-end">
        <button
          @click="goToMapping"
          :disabled="!allUploaded"
          :class="[
            'px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-300',
            allUploaded
              ? 'bg-primary text-white hover:bg-blue-700 shadow-lg shadow-primary/20'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-dark-border'
          ]"
        >
          Next: Map Headers
        </button>
      </div>
    </div>

    <!-- Phase 2: Header Mapping -->
    <div v-if="currentStep === 1">
      <div v-if="sheetsNeedingMapping.length === 0" class="text-center py-12">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
          <svg class="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">All Headers Auto-Matched!</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">No manual mapping needed.</p>
      </div>

      <div v-else class="space-y-6">
        <HeaderMapper
          v-for="sheetType in sheetsNeedingMapping"
          :key="sheetType"
          :label="getSheetLabel(sheetType)"
          :expectedHeaders="getExpectedHeaders(sheetType)"
          :uploadedHeaders="uploadResults[sheetType]?.uploadedHeaders || []"
          :initialMapping="uploadResults[sheetType]?.mapping || {}"
          @save-mapping="(mapping) => handleSaveMapping(sheetType, mapping)"
        />
      </div>

      <div class="mt-6 flex justify-between">
        <button
          @click="currentStep = 0"
          class="px-6 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
        >
          Back
        </button>
        <button
          @click="goToGenerate"
          :disabled="!allMapped"
          :class="[
            'px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-300',
            allMapped
              ? 'bg-primary text-white hover:bg-blue-700 shadow-lg shadow-primary/20'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-dark-border'
          ]"
        >
          Next: Generate Output
        </button>
      </div>
    </div>

    <!-- Phase 3: Generate & View Output -->
    <div v-if="currentStep === 2">
      <div v-if="!outputData" class="text-center py-16">
        <div v-if="generating" class="space-y-4">
          <div class="w-12 h-12 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p class="text-gray-600 dark:text-gray-300 font-medium">Calculating IC Output...</p>
          <p class="text-sm text-gray-400">Processing all 9 input sheets</p>
        </div>
        <div v-else>
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Ready to Generate</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">All 9 sheets are uploaded and headers are mapped.</p>
          <button
            @click="handleGenerate"
            class="px-8 py-3 text-sm font-medium text-white bg-primary rounded-lg hover:bg-blue-700 shadow-lg shadow-primary/20 transition-all duration-300"
          >
            Generate IC Output
          </button>
        </div>
      </div>

      <OutputTable
        v-if="outputData"
        :headers="outputData.headers"
        :rows="outputData.rows"
        @download="handleDownload"
      />

      <div class="mt-6 flex justify-between">
        <button
          @click="currentStep = 1"
          class="px-6 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
        >
          Back
        </button>
      </div>

      <!-- Error -->
      <div v-if="generateError" class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <p class="text-sm text-error">{{ generateError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Stepper from '../components/Stepper.vue';
import SheetUploadGrid from '../components/SheetUploadGrid.vue';
import HeaderMapper from '../components/HeaderMapper.vue';
import OutputTable from '../components/OutputTable.vue';
import { SHEET_TYPES, SHEET_ORDER } from '../config/sheetConfig.js';
import {
  createSession,
  uploadSheet,
  pasteSheet,
  saveMapping,
  generateOutput,
  getDownloadUrl
} from '../services/api.js';

const sessionId = ref(null);
const currentStep = ref(0);
const uploadResults = ref({});
const outputData = ref(null);
const generating = ref(false);
const generateError = ref('');

onMounted(async () => {
  try {
    const { data } = await createSession();
    sessionId.value = data.sessionId;
  } catch (err) {
    console.error('Failed to create session:', err);
  }
});

const allUploaded = computed(() =>
  SHEET_ORDER.every((type) => uploadResults.value[type])
);

const sheetsNeedingMapping = computed(() =>
  SHEET_ORDER.filter((type) => {
    const result = uploadResults.value[type];
    return result && result.needsMapping && result.needsMapping.length > 0;
  })
);

const allMapped = computed(() => sheetsNeedingMapping.value.length === 0 && allUploaded.value);

function getSheetLabel(sheetType) {
  return SHEET_TYPES[sheetType]?.label || sheetType;
}

function getExpectedHeaders(sheetType) {
  return SHEET_TYPES[sheetType]?.expectedHeaders || [];
}

async function handleUploadFile({ sheetType, file }) {
  if (!sessionId.value) return;
  try {
    const { data } = await uploadSheet(sessionId.value, sheetType, file);
    uploadResults.value = { ...uploadResults.value, [sheetType]: data };
  } catch (err) {
    console.error('Upload failed:', err);
    throw new Error(err.response?.data?.error || 'Upload failed');
  }
}

async function handlePasteData({ sheetType, rows }) {
  if (!sessionId.value) return;
  try {
    const { data } = await pasteSheet(sessionId.value, sheetType, rows);
    uploadResults.value = { ...uploadResults.value, [sheetType]: data };
  } catch (err) {
    console.error('Paste failed:', err);
    throw new Error(err.response?.data?.error || 'Paste failed');
  }
}

function handleReset(sheetType) {
  const results = { ...uploadResults.value };
  delete results[sheetType];
  uploadResults.value = results;
}

function goToMapping() {
  if (allUploaded.value) currentStep.value = 1;
}

async function handleSaveMapping(sheetType, mapping) {
  if (!sessionId.value) return;
  try {
    await saveMapping(sessionId.value, sheetType, mapping);
    // Update local result to reflect mapping is done
    const result = uploadResults.value[sheetType];
    if (result) {
      uploadResults.value = {
        ...uploadResults.value,
        [sheetType]: { ...result, needsMapping: [], mapping }
      };
    }
  } catch (err) {
    console.error('Save mapping failed:', err);
  }
}

function goToGenerate() {
  if (allMapped.value) currentStep.value = 2;
}

async function handleGenerate() {
  if (!sessionId.value) return;
  generating.value = true;
  generateError.value = '';
  try {
    const { data } = await generateOutput(sessionId.value);
    outputData.value = data;
  } catch (err) {
    generateError.value = err.response?.data?.error || 'Generation failed';
    console.error('Generate failed:', err);
  } finally {
    generating.value = false;
  }
}

function handleDownload() {
  if (!sessionId.value) return;
  window.open(getDownloadUrl(sessionId.value), '_blank');
}
</script>
