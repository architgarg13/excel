<template>
  <div class="flex items-center justify-center mb-10">
    <div v-for="(step, i) in steps" :key="i" class="flex items-center">
      <div class="flex items-center gap-2.5">
        <div
          :class="[
            'w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500',
            currentStep === i
              ? 'bg-gradient-to-br from-primary to-blue-500 text-white shadow-lg shadow-primary/30 ring-4 ring-primary/10 dark:ring-primary/20'
              : currentStep > i
                ? 'bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-md shadow-green-500/20'
                : 'bg-gray-100 dark:bg-dark-border text-gray-400 dark:text-gray-500'
          ]"
        >
          <svg v-if="currentStep > i" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
          <span v-else>{{ i + 1 }}</span>
        </div>
        <span
          :class="[
            'text-sm font-semibold transition-colors duration-300',
            currentStep === i
              ? 'text-gray-900 dark:text-white'
              : currentStep > i
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-gray-400 dark:text-gray-500'
          ]"
        >
          {{ step }}
        </span>
      </div>
      <div
        v-if="i < steps.length - 1"
        :class="[
          'w-20 h-0.5 mx-4 rounded-full transition-all duration-500',
          currentStep > i
            ? 'bg-gradient-to-r from-emerald-500 to-green-400'
            : 'bg-gray-200 dark:bg-dark-border'
        ]"
      />
    </div>
  </div>
</template>

<script setup>
defineProps({
  steps: { type: Array, required: true },
  currentStep: { type: Number, default: 0 }
});
</script>
