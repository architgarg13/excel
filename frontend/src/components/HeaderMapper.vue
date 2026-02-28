<template>
  <div class="p-4 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border">
    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
      Map Headers — {{ label }}
    </h3>

    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
      Match each expected header to the corresponding uploaded header.
    </p>

    <div class="space-y-2 max-h-96 overflow-y-auto pr-2">
      <div
        v-for="expected in expectedHeaders"
        :key="expected"
        class="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-dark-bg"
      >
        <span class="w-1/2 text-sm font-medium text-gray-700 dark:text-gray-300 truncate" :title="expected">
          {{ expected }}
        </span>
        <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        <select
          :value="localMapping[expected] || ''"
          @change="updateMapping(expected, ($event.target).value)"
          class="w-1/2 text-sm p-1.5 rounded border bg-white dark:bg-dark-card
                 border-gray-300 dark:border-dark-border text-gray-800 dark:text-gray-200
                 focus:ring-2 focus:ring-primary outline-none"
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

    <div class="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-dark-border">
      <span class="text-sm" :class="allMapped ? 'text-success' : 'text-gray-400'">
        {{ mappedCount }}/{{ expectedHeaders.length }} mapped
      </span>
      <button
        @click="saveMapping"
        :disabled="!allMapped"
        :class="[
          'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
          allMapped
            ? 'bg-primary text-white hover:bg-blue-700'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-dark-border'
        ]"
      >
        Save Mapping
      </button>
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
