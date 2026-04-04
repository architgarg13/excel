<template>
  <div class="rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-soft overflow-hidden">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border-b border-gray-100 dark:border-dark-border gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-md shadow-primary/20">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
          </svg>
        </div>
        <div>
          <h3 class="text-base font-bold text-gray-800 dark:text-gray-100">IC Output - HUB</h3>
          <p class="text-xs text-gray-400 dark:text-gray-500">{{ rows.length }} rows generated</p>
        </div>
      </div>
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <button
          @click="$emit('download')"
          class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg hover:from-emerald-600 hover:to-green-600 shadow-md shadow-green-500/20 transition-all duration-300"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download .xlsx
        </button>
        <button
          @click="$emit('download-audit')"
          class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-blue-500 rounded-lg hover:from-blue-700 hover:to-blue-600 shadow-md shadow-primary/20 transition-all duration-300"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Audit Trail (.docx)
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto max-h-[600px] overflow-y-auto">
      <table class="min-w-full text-sm">
        <thead class="sticky top-0 z-10">
          <tr class="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-dark-border dark:to-dark-border/80">
            <th class="px-3 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider">
              #
            </th>
            <th
              v-for="header in headers"
              :key="header"
              class="px-3 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider"
            >
              {{ header }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, i) in displayedRows"
            :key="i"
            :class="[
              'border-t border-gray-50 dark:border-dark-border/50 hover:bg-blue-50/30 dark:hover:bg-primary/5 transition-colors',
              i % 2 === 0 ? 'bg-white dark:bg-dark-card' : 'bg-gray-50/30 dark:bg-dark-bg/20'
            ]"
          >
            <td class="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-400 dark:text-gray-500">
              {{ page * pageSize + i + 1 }}
            </td>
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

    <!-- Pagination -->
    <div v-if="rows.length > pageSize" class="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg/30">
      <span class="text-xs text-gray-400 dark:text-gray-500">
        Showing {{ page * pageSize + 1 }}–{{ Math.min((page + 1) * pageSize, rows.length) }} of {{ rows.length }}
      </span>
      <div class="flex items-center gap-1">
        <button
          @click="page = 0"
          :disabled="page === 0"
          class="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          First
        </button>
        <button
          @click="page = Math.max(0, page - 1)"
          :disabled="page === 0"
          class="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Prev
        </button>
        <span class="px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border">
          {{ page + 1 }} / {{ totalPages }}
        </span>
        <button
          @click="page = Math.min(totalPages - 1, page + 1)"
          :disabled="page >= totalPages - 1"
          class="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
        <button
          @click="page = totalPages - 1"
          :disabled="page >= totalPages - 1"
          class="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Last
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  headers: { type: Array, required: true },
  rows: { type: Array, required: true }
});

defineEmits(['download', 'download-audit']);

const pageSize = 100;
const page = ref(0);

const totalPages = computed(() => Math.ceil(props.rows.length / pageSize));
const displayedRows = computed(() =>
  props.rows.slice(page.value * pageSize, (page.value + 1) * pageSize)
);
</script>
