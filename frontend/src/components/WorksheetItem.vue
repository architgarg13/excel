<template>
  <div class="rounded-xl bg-light-card dark:bg-dark-card shadow-soft hover-lift overflow-hidden">
    <button
      class="w-full px-5 py-4 flex items-center justify-between text-left transition-colors
             hover:bg-gray-50 dark:hover:bg-dark-border/50"
      @click="isOpen = !isOpen"
    >
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span class="font-medium text-gray-900 dark:text-white">{{ worksheet.name }}</span>
        <span class="text-xs text-gray-400 dark:text-gray-500">
          {{ worksheet.headers.length }} header{{ worksheet.headers.length !== 1 ? 's' : '' }}
        </span>
      </div>
      <svg
        class="w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform duration-300"
        :class="{ 'rotate-90': isOpen }"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
    <Transition name="accordion">
      <div v-if="isOpen">
        <div class="border-t border-gray-100 dark:border-dark-border">
          <HeaderList :headers="worksheet.headers" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import HeaderList from './HeaderList.vue';

defineProps({
  worksheet: {
    type: Object,
    required: true,
  },
});

const isOpen = ref(false);
</script>
