<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Stepper -->
    <Stepper :steps="['Upload & Review', 'Generate Output']" :currentStep="currentStep" />

    <!-- Step 0: Upload & Review -->
    <div v-if="currentStep === 0">
      <WorkbookUpload
        v-if="sessionId"
        :sessionId="sessionId"
        @upload-complete="handleWorkbookUpload"
        @worksheets-mapped="handleWorksheetsMapped"
        @reset="handleReset"
      />

      <!-- Header mappers for sheets needing mapping -->
      <div v-if="workbookResult && sheetsNeedingMapping.length > 0" class="mt-6 space-y-6">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Header Mapping Required</h3>
        <HeaderMapper
          v-for="sheetType in sheetsNeedingMapping"
          :key="sheetType"
          :label="getSheetLabel(sheetType)"
          :expectedHeaders="getExpectedHeaders(sheetType)"
          :uploadedHeaders="getUploadedHeaders(sheetType)"
          :initialMapping="getInitialMapping(sheetType)"
          @save-mapping="(mapping) => handleSaveMapping(sheetType, mapping)"
        />
      </div>

      <!-- All headers auto-matched message -->
      <div v-if="workbookResult && sheetsNeedingMapping.length === 0 && allSheetsMatched" class="mt-6 text-center py-8">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">All Sheets & Headers Matched!</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Ready to generate output.</p>
      </div>

      <div class="mt-6 flex justify-end">
        <button
          @click="currentStep = 1"
          :disabled="!canProceed"
          :class="[
            'px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-300',
            canProceed
              ? 'bg-primary text-white hover:bg-blue-700 shadow-lg shadow-primary/20'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-dark-border'
          ]"
        >
          Next: Generate Output
        </button>
      </div>
    </div>

    <!-- Step 1: Generate & View Output -->
    <div v-if="currentStep === 1">
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
          @click="currentStep = 0"
          class="px-6 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
        >
          Back
        </button>
      </div>

      <!-- Error -->
      <div v-if="generateError" class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <p class="text-sm text-red-600 dark:text-red-400">{{ generateError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Stepper from '../components/Stepper.vue';
import WorkbookUpload from '../components/WorkbookUpload.vue';
import HeaderMapper from '../components/HeaderMapper.vue';
import OutputTable from '../components/OutputTable.vue';
import { SHEET_TYPES, SHEET_ORDER } from '../config/sheetConfig.js';
import {
  createSession,
  saveMapping,
  generateOutput,
  getDownloadUrl
} from '../services/api.js';

const sessionId = ref(null);
const currentStep = ref(0);
const workbookResult = ref(null);
const mappingSaved = ref(new Set());
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

const allSheetsMatched = computed(() => workbookResult.value?.allMatched ?? false);

const sheetsNeedingMapping = computed(() => {
  if (!workbookResult.value) return [];
  return (workbookResult.value.sheetsNeedingHeaderMapping || [])
    .filter(type => !mappingSaved.value.has(type));
});

const canProceed = computed(() =>
  allSheetsMatched.value && sheetsNeedingMapping.value.length === 0
);

function getSheetLabel(sheetType) {
  return SHEET_TYPES[sheetType]?.label || sheetType;
}

function getExpectedHeaders(sheetType) {
  return SHEET_TYPES[sheetType]?.expectedHeaders || [];
}

function getUploadedHeaders(sheetType) {
  const matched = workbookResult.value?.matchedSheets?.find(s => s.sheetType === sheetType);
  return matched?.uploadedHeaders || [];
}

function getInitialMapping(sheetType) {
  const matched = workbookResult.value?.matchedSheets?.find(s => s.sheetType === sheetType);
  return matched?.mapping || {};
}

function handleWorkbookUpload(data) {
  workbookResult.value = data;
  mappingSaved.value = new Set();
}

function handleWorksheetsMapped(data) {
  workbookResult.value = data;
}

function handleReset() {
  workbookResult.value = null;
  mappingSaved.value = new Set();
  outputData.value = null;
}

async function handleSaveMapping(sheetType, mapping) {
  if (!sessionId.value) return;
  try {
    await saveMapping(sessionId.value, sheetType, mapping);
    mappingSaved.value = new Set([...mappingSaved.value, sheetType]);
  } catch (err) {
    console.error('Save mapping failed:', err);
  }
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
