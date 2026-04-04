<template>
  <div class="rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-soft overflow-hidden">
    <div class="p-5 border-b border-gray-100 dark:border-dark-border flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
          <svg class="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <div>
          <h3 class="text-base font-bold text-gray-800 dark:text-gray-100">{{ label }}</h3>
          <p class="text-xs text-gray-400 dark:text-gray-500">Map each expected header to uploaded header</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <!-- Progress bar -->
        <div class="hidden sm:flex items-center gap-2">
          <div class="w-24 h-2 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="allMapped ? 'bg-emerald-500' : 'bg-amber-400'"
              :style="{ width: (mappedCount / expectedHeaders.length * 100) + '%' }"
            />
          </div>
          <span class="text-xs font-semibold" :class="allMapped ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'">
            {{ mappedCount }}/{{ expectedHeaders.length }}
          </span>
        </div>
      </div>
    </div>

    <div class="p-5 space-y-2 max-h-96 overflow-y-auto">
      <div
        v-for="expected in expectedHeaders"
        :key="expected"
        :class="[
          'flex items-center gap-3 p-2.5 rounded-xl transition-colors',
          localMapping[expected]
            ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30'
            : 'bg-gray-50 dark:bg-dark-bg border border-transparent'
        ]"
      >
        <span class="w-1/2 text-sm font-medium text-gray-700 dark:text-gray-300 truncate" :title="expected">
          {{ expected }}
        </span>
        <svg class="w-4 h-4 flex-shrink-0" :class="localMapping[expected] ? 'text-emerald-400' : 'text-gray-300 dark:text-gray-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        <select
          :value="localMapping[expected] || ''"
          @change="updateMapping(expected, ($event.target).value)"
          class="w-1/2 text-sm p-2 rounded-lg border bg-white dark:bg-dark-card
                 border-gray-200 dark:border-dark-border text-gray-800 dark:text-gray-200
                 focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30 outline-none transition-shadow"
        >
          <option value="">-- Select --</option>
          <option
            v-for="uh in uploadedHeaders"
            :key="uh"
            :value="uh"
          >
            {{ uh }}
          </option>
        </select>
      </div>
    </div>

    <div class="flex items-center justify-between p-5 border-t border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg/50">
      <span class="text-sm font-medium sm:hidden" :class="allMapped ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'">
        {{ mappedCount }}/{{ expectedHeaders.length }} mapped
      </span>
      <div class="sm:ml-auto">
        <button
          @click="saveMapping"
          :disabled="!allMapped"
          :class="[
            'px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300',
            allMapped
              ? 'bg-primary text-white hover:bg-blue-700 shadow-md shadow-primary/20'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-dark-border dark:text-gray-500'
          ]"
        >
          Save Mapping
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  label: { type: String, required: true },
  expectedHeaders: { type: Array, required: true },
  uploadedHeaders: { type: Array, required: true },
  initialMapping: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['save-mapping']);

const localMapping = ref({ ...props.initialMapping });

watch(() => props.initialMapping, (val) => {
  localMapping.value = { ...val };
}, { deep: true });

const mappedCount = computed(() =>
  props.expectedHeaders.filter((h) => localMapping.value[h]).length
);

const allMapped = computed(() => mappedCount.value === props.expectedHeaders.length);

function updateMapping(expected, uploaded) {
  localMapping.value[expected] = uploaded || undefined;
}

function saveMapping() {
  if (allMapped.value) {
    emit('save-mapping', { ...localMapping.value });
  }
}
</script>
