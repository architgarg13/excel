<template>
  <div class="rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border overflow-hidden">
    <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border">
      <div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">IC Output - HUB</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ rows.length }} rows</p>
      </div>
      <button
        @click="$emit('download')"
        class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-success rounded-lg hover:bg-green-600 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download .xlsx
      </button>
    </div>

    <div class="overflow-x-auto max-h-[600px] overflow-y-auto">
      <table class="min-w-full text-sm">
        <thead class="sticky top-0 z-10">
          <tr class="bg-gray-100 dark:bg-dark-border">
            <th
              v-for="header in headers"
              :key="header"
              class="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap"
            >
              {{ header }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, i) in displayedRows"
            :key="i"
            class="border-t border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
          >
            <td
              v-for="(cell, j) in row"
              :key="j"
              class="px-3 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300"
            >
              {{ cell != null ? cell : '' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="rows.length > pageSize" class="flex items-center justify-center gap-3 p-3 border-t border-gray-200 dark:border-dark-border">
      <button
        @click="page = Math.max(0, page - 1)"
        :disabled="page === 0"
        class="px-3 py-1 text-sm rounded border border-gray-300 dark:border-dark-border disabled:opacity-40"
      >
        Previous
      </button>
      <span class="text-sm text-gray-500">Page {{ page + 1 }} of {{ totalPages }}</span>
      <button
        @click="page = Math.min(totalPages - 1, page + 1)"
        :disabled="page >= totalPages - 1"
        class="px-3 py-1 text-sm rounded border border-gray-300 dark:border-dark-border disabled:opacity-40"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  headers: { type: Array, required: true },
  rows: { type: Array, required: true }
});

defineEmits(['download']);

const pageSize = 100;
const page = ref(0);

const totalPages = computed(() => Math.ceil(props.rows.length / pageSize));
const displayedRows = computed(() =>
  props.rows.slice(page.value * pageSize, (page.value + 1) * pageSize)
);
</script>
