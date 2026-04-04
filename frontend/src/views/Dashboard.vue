<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
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
      <div v-if="workbookResult && sheetsNeedingMapping.length > 0" class="mt-6 space-y-5">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <h3 class="text-base font-bold text-gray-800 dark:text-gray-100">Header Mapping Required</h3>
        </div>
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

      <!-- All headers auto-matched - auto-advancing message -->
      <div v-if="workbookResult && sheetsNeedingMapping.length === 0 && allSheetsMatched && !autoAdvancing" class="mt-6 text-center py-8">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center animate-check-pop">
          <svg class="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">All Sheets & Headers Matched!</h3>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Auto-generating output...</p>
      </div>

      <!-- Manual proceed button (only shown if auto-advance didn't trigger) -->
      <div v-if="workbookResult && canProceed && !autoAdvancing" class="mt-6 flex justify-end">
        <button
          @click="goToGenerate"
          class="px-6 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-primary to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-primary/20 transition-all duration-300"
        >
          Generate Output
        </button>
      </div>
    </div>

    <!-- Step 1: Generate & View Output -->
    <div v-if="currentStep === 1">
      <!-- Loading state -->
      <div v-if="!outputData && generating" class="text-center py-20">
        <div class="relative w-16 h-16 mx-auto mb-6">
          <div class="w-16 h-16 border-4 border-primary/20 dark:border-primary/10 rounded-full" />
          <div class="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p class="text-gray-700 dark:text-gray-200 font-semibold text-lg">Calculating IC Output...</p>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-2">Processing all 9 input sheets</p>
      </div>

      <!-- Ready to Generate (fallback - only if auto-generate didn't trigger) -->
      <div v-if="!outputData && !generating" class="text-center py-20">
        <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-50 dark:bg-dark-border flex items-center justify-center">
          <svg class="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Ready to Generate</h3>
        <p class="text-sm text-gray-400 dark:text-gray-500 mb-6">All 9 sheets are uploaded and headers are mapped.</p>
        <button
          @click="handleGenerate"
          class="px-8 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary to-blue-500 rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-primary/20 transition-all duration-300"
        >
          Generate IC Output
        </button>
      </div>

      <OutputTable
        v-if="outputData"
        :headers="outputData.headers"
        :rows="outputData.rows"
        @download="handleDownload"
        @download-audit="handleDownloadAudit"
      />

      <div class="mt-6 flex justify-between">
        <button
          @click="currentStep = 0"
          class="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg hover:text-gray-800 dark:hover:text-gray-200 transition-all"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>

      <!-- Error -->
      <div v-if="generateError" class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 flex items-start gap-3">
        <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-sm text-red-600 dark:text-red-400">{{ generateError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import Stepper from '../components/Stepper.vue';
import WorkbookUpload from '../components/WorkbookUpload.vue';
import HeaderMapper from '../components/HeaderMapper.vue';
import OutputTable from '../components/OutputTable.vue';
import { SHEET_TYPES, SHEET_ORDER } from '../config/sheetConfig.js';
import {
  createSession,
  saveMapping,
  generateOutput,
  getDownloadUrl,
  getAuditDownloadUrl
} from '../services/api.js';

const sessionId = ref(null);
const currentStep = ref(0);
const workbookResult = ref(null);
const mappingSaved = ref(new Set());
const outputData = ref(null);
const generating = ref(false);
const generateError = ref('');
const autoAdvancing = ref(false);

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

// Auto-advance: when all sheets matched and no mapping needed, auto-generate
watch(canProceed, (ready) => {
  if (ready && currentStep.value === 0 && !outputData.value && !autoAdvancing.value) {
    autoAdvancing.value = true;
    setTimeout(() => {
      goToGenerate();
      autoAdvancing.value = false;
    }, 1200);
  }
});

function goToGenerate() {
  currentStep.value = 1;
  if (!outputData.value && !generating.value) {
    handleGenerate();
  }
}

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
  autoAdvancing.value = false;
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

function handleDownloadAudit() {
  if (!sessionId.value) return;
  window.open(getAuditDownloadUrl(sessionId.value), '_blank');
}
</script>
