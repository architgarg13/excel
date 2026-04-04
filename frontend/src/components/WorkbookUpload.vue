<template>
  <div>
    <!-- State A: No file uploaded yet -->
    <div v-if="!result" class="rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-soft p-6">
      <div class="text-center mb-4">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">Upload Workbook</h3>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">One .xlsx file containing all 9 input sheets</p>
      </div>

      <div
        @dragover.prevent="dragActive = true"
        @dragleave.prevent="dragActive = false"
        @drop.prevent="handleDrop"
        :class="[
          'relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 cursor-pointer group',
          dragActive
            ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-lg shadow-primary/10'
            : 'border-gray-200 dark:border-dark-border hover:border-primary/40 dark:hover:border-primary/40 hover:bg-gray-50/50 dark:hover:bg-dark-bg/50'
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

        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
          <svg class="w-8 h-8 text-primary/60 dark:text-blue-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h3 class="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">
          Drop your .xlsx workbook here
        </h3>
        <p class="text-sm text-gray-400 dark:text-gray-500">or click to browse</p>
      </div>

      <!-- Upload progress -->
      <div v-if="uploading" class="mt-5">
        <div class="flex items-center gap-3">
          <div class="flex-1 h-2.5 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-300"
              :style="{ width: uploadProgress + '%' }"
            />
          </div>
          <span class="text-sm font-medium text-primary w-12 text-right">{{ uploadProgress }}%</span>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
          <svg class="w-4 h-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Uploading and analyzing worksheets...
        </p>
      </div>

      <!-- Error -->
      <div v-if="error" class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 flex items-start gap-3">
        <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
      </div>
    </div>

    <!-- State B: Upload results summary -->
    <div v-else class="rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-soft overflow-hidden">
      <div class="flex items-center justify-between p-5 border-b border-gray-100 dark:border-dark-border">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 class="text-base font-bold text-gray-800 dark:text-gray-100">Worksheet Matching Results</h3>
        </div>
        <button
          @click="handleReupload"
          class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-dark-border text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg hover:text-gray-700 dark:hover:text-gray-200 transition-all"
        >
          Re-upload
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50/80 dark:bg-dark-bg/80">
              <th class="text-left px-5 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Status</th>
              <th class="text-left px-5 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Sheet Type</th>
              <th class="text-left px-5 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Worksheet Name</th>
              <th class="text-left px-5 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Rows</th>
              <th class="text-left px-5 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Headers</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50 dark:divide-dark-border/50">
            <tr
              v-for="(type, idx) in sheetOrder"
              :key="type"
              :class="[
                'transition-colors',
                idx % 2 === 0 ? 'bg-white dark:bg-dark-card' : 'bg-gray-50/40 dark:bg-dark-bg/30'
              ]"
            >
              <td class="px-5 py-3">
                <div v-if="matchedMap[type]" class="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                  <svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div v-else class="w-6 h-6 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                  <svg class="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </td>
              <td class="px-5 py-3 font-medium text-gray-800 dark:text-gray-200">{{ sheetLabels[type] }}</td>
              <td class="px-5 py-3 text-gray-500 dark:text-gray-400">
                {{ matchedMap[type]?.worksheetName || '—' }}
              </td>
              <td class="px-5 py-3 text-gray-500 dark:text-gray-400">
                {{ matchedMap[type]?.rowCount ?? '—' }}
              </td>
              <td class="px-5 py-3">
                <span v-if="matchedMap[type]">
                  <span v-if="matchedMap[type].needsMapping.length === 0"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                    All matched
                  </span>
                  <span v-else
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    {{ matchedMap[type].needsMapping.length }} need mapping
                  </span>
                </span>
                <span v-else class="text-gray-300 dark:text-gray-600">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Manual assignment for unmatched worksheets -->
      <div v-if="result.unmatchedWorksheets.length > 0 && result.missingSheetTypes.length > 0" class="m-5 p-5 rounded-xl bg-amber-50/80 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/40">
        <h4 class="text-sm font-bold text-amber-800 dark:text-amber-200 mb-4 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Unmatched Worksheets — Assign manually
        </h4>
        <div class="space-y-3">
          <div
            v-for="ws in result.unmatchedWorksheets"
            :key="ws.worksheetName"
            class="flex items-center gap-3 p-2 rounded-lg bg-white/60 dark:bg-dark-card/60"
          >
            <span class="text-sm text-gray-700 dark:text-gray-300 w-48 truncate font-medium" :title="ws.worksheetName">
              "{{ ws.worksheetName }}" <span class="text-gray-400 font-normal">({{ ws.rowCount }} rows)</span>
            </span>
            <svg class="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <select
              v-model="manualMappings[ws.worksheetName]"
              class="text-sm p-2 rounded-lg border bg-white dark:bg-dark-card border-gray-200 dark:border-dark-border text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30 outline-none transition-shadow"
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
            'mt-4 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300',
            hasManualMappings && !mappingInProgress
              ? 'bg-primary text-white hover:bg-blue-700 shadow-md shadow-primary/20'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-dark-border dark:text-gray-500'
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

    const updatedMatched = [...result.value.matchedSheets];
    for (const sheet of data.newlyMatched) {
      const idx = updatedMatched.findIndex(s => s.sheetType === sheet.sheetType);
      if (idx >= 0) updatedMatched[idx] = sheet;
      else updatedMatched.push(sheet);
    }

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
