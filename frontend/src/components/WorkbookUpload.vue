<template>
  <div>
    <!-- State A: No file uploaded yet -->
    <div v-if="!result">
      <div
        @dragover.prevent="dragActive = true"
        @dragleave.prevent="dragActive = false"
        @drop.prevent="handleDrop"
        :class="[
          'border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer',
          dragActive
            ? 'border-primary bg-primary/5 dark:bg-primary/10'
            : 'border-gray-300 dark:border-dark-border hover:border-primary/50'
        ]"
        @click="openFilePicker"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".xlsx,.xls"
          class="hidden"
          @change="handleFileSelect"
        />

        <svg class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
          Drop your .xlsx workbook here
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          One file containing all 9 input sheets as worksheets
        </p>
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">or click to browse</p>
      </div>

      <!-- Upload progress -->
      <div v-if="uploading" class="mt-4">
        <div class="flex items-center gap-3">
          <div class="flex-1 h-2 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden">
            <div
              class="h-full bg-primary rounded-full transition-all duration-300"
              :style="{ width: uploadProgress + '%' }"
            />
          </div>
          <span class="text-sm text-gray-500 dark:text-gray-400 w-12 text-right">{{ uploadProgress }}%</span>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Uploading and analyzing worksheets...</p>
      </div>

      <!-- Error -->
      <div v-if="error" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
      </div>
    </div>

    <!-- State B: Upload results summary -->
    <div v-else>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Worksheet Matching Results</h3>
        <button
          @click="handleReupload"
          class="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
        >
          Re-upload
        </button>
      </div>

      <div class="rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 dark:bg-dark-bg">
              <th class="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">Status</th>
              <th class="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">Sheet Type</th>
              <th class="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">Worksheet Name</th>
              <th class="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">Rows</th>
              <th class="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">Headers</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-dark-border">
            <tr
              v-for="type in sheetOrder"
              :key="type"
              class="bg-white dark:bg-dark-card"
            >
              <td class="px-4 py-2.5">
                <svg v-if="matchedMap[type]" class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </td>
              <td class="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200">{{ sheetLabels[type] }}</td>
              <td class="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                {{ matchedMap[type]?.worksheetName || '—' }}
              </td>
              <td class="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                {{ matchedMap[type]?.rowCount ?? '—' }}
              </td>
              <td class="px-4 py-2.5">
                <span v-if="matchedMap[type]">
                  <span v-if="matchedMap[type].needsMapping.length === 0" class="text-green-600 dark:text-green-400 text-xs font-medium">All matched</span>
                  <span v-else class="text-amber-600 dark:text-amber-400 text-xs font-medium">{{ matchedMap[type].needsMapping.length }} need mapping</span>
                </span>
                <span v-else>—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Manual assignment for unmatched worksheets -->
      <div v-if="result.unmatchedWorksheets.length > 0 && result.missingSheetTypes.length > 0" class="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <h4 class="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-3">
          Unmatched Worksheets — Assign manually
        </h4>
        <div class="space-y-2">
          <div
            v-for="ws in result.unmatchedWorksheets"
            :key="ws.worksheetName"
            class="flex items-center gap-3"
          >
            <span class="text-sm text-gray-700 dark:text-gray-300 w-48 truncate" :title="ws.worksheetName">
              "{{ ws.worksheetName }}" ({{ ws.rowCount }} rows)
            </span>
            <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <select
              v-model="manualMappings[ws.worksheetName]"
              class="text-sm p-1.5 rounded border bg-white dark:bg-dark-card border-gray-300 dark:border-dark-border text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="">-- Skip --</option>
              <option
                v-for="missing in availableMissingTypes(ws.worksheetName)"
                :key="missing.sheetType"
                :value="missing.sheetType"
              >
                {{ missing.label }}
              </option>
            </select>
          </div>
        </div>
        <button
          @click="submitManualMappings"
          :disabled="!hasManualMappings || mappingInProgress"
          :class="[
            'mt-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            hasManualMappings && !mappingInProgress
              ? 'bg-primary text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-dark-border'
          ]"
        >
          {{ mappingInProgress ? 'Assigning...' : 'Assign Selected' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { SHEET_TYPES, SHEET_ORDER } from '../config/sheetConfig.js';
import { uploadWorkbook, mapWorksheets } from '../services/api.js';

const props = defineProps({
  sessionId: { type: String, required: true }
});

const emit = defineEmits(['upload-complete', 'worksheets-mapped', 'reset']);

const fileInput = ref(null);
const dragActive = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const error = ref('');
const result = ref(null);
const manualMappings = ref({});
const mappingInProgress = ref(false);

const sheetOrder = SHEET_ORDER;
const sheetLabels = Object.fromEntries(
  Object.entries(SHEET_TYPES).map(([k, v]) => [k, v.label])
);

const matchedMap = computed(() => {
  if (!result.value) return {};
  const map = {};
  for (const sheet of result.value.matchedSheets) {
    map[sheet.sheetType] = sheet;
  }
  return map;
});

const hasManualMappings = computed(() =>
  Object.values(manualMappings.value).some(v => v)
);

function availableMissingTypes(wsName) {
  // Show missing types that haven't been assigned to another worksheet
  const assigned = new Set();
  for (const [name, type] of Object.entries(manualMappings.value)) {
    if (name !== wsName && type) assigned.add(type);
  }
  return result.value.missingSheetTypes.filter(m => !assigned.has(m.sheetType));
}

function openFilePicker() {
  if (!uploading.value) fileInput.value?.click();
}

function handleDrop(e) {
  dragActive.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) doUpload(file);
}

function handleFileSelect(e) {
  const file = e.target.files?.[0];
  if (file) doUpload(file);
}

async function doUpload(file) {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['xlsx', 'xls'].includes(ext)) {
    error.value = 'Please upload a .xlsx or .xls file.';
    return;
  }

  error.value = '';
  uploading.value = true;
  uploadProgress.value = 0;

  try {
    const { data } = await uploadWorkbook(props.sessionId, file, (pct) => {
      uploadProgress.value = pct;
    });
    result.value = data;
    manualMappings.value = {};
    emit('upload-complete', data);
  } catch (err) {
    error.value = err.response?.data?.error || 'Upload failed. Please try again.';
  } finally {
    uploading.value = false;
    if (fileInput.value) fileInput.value.value = '';
  }
}

async function submitManualMappings() {
  const mappings = {};
  for (const [wsName, sheetType] of Object.entries(manualMappings.value)) {
    if (sheetType) mappings[wsName] = sheetType;
  }
  if (Object.keys(mappings).length === 0) return;

  mappingInProgress.value = true;
  try {
    const { data } = await mapWorksheets(props.sessionId, mappings);

    // Merge newly matched sheets into result
    const updatedMatched = [...result.value.matchedSheets];
    for (const sheet of data.newlyMatched) {
      const idx = updatedMatched.findIndex(s => s.sheetType === sheet.sheetType);
      if (idx >= 0) updatedMatched[idx] = sheet;
      else updatedMatched.push(sheet);
    }

    // Remove assigned worksheets from unmatched
    const assignedNames = new Set(Object.keys(mappings));
    const remainingUnmatched = result.value.unmatchedWorksheets.filter(
      ws => !assignedNames.has(ws.worksheetName)
    );

    result.value = {
      ...result.value,
      matchedSheets: updatedMatched,
      missingSheetTypes: data.missingSheetTypes,
      unmatchedWorksheets: remainingUnmatched,
      allMatched: data.allMatched,
      sheetsNeedingHeaderMapping: [
        ...new Set([
          ...result.value.sheetsNeedingHeaderMapping.filter(
            t => !data.newlyMatched.some(s => s.sheetType === t)
          ),
          ...data.sheetsNeedingHeaderMapping
        ])
      ]
    };

    manualMappings.value = {};
    emit('worksheets-mapped', result.value);
  } catch (err) {
    error.value = err.response?.data?.error || 'Mapping failed.';
  } finally {
    mappingInProgress.value = false;
  }
}

function handleReupload() {
  result.value = null;
  error.value = '';
  manualMappings.value = {};
  emit('reset');
}
</script>
