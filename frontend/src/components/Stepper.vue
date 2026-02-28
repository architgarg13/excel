<template>
  <div class="flex items-center justify-center mb-8">
    <div v-for="(step, i) in steps" :key="i" class="flex items-center">
      <div class="flex items-center">
        <div
          :class="[
            'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300',
            currentStep === i
              ? 'bg-primary text-white shadow-lg shadow-primary/30'
              : currentStep > i
                ? 'bg-success text-white'
                : 'bg-gray-200 dark:bg-dark-border text-gray-500 dark:text-gray-400'
          ]"
        >
          <svg v-if="currentStep > i" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span v-else>{{ i + 1 }}</span>
        </div>
        <span
          :class="[
            'ml-2 text-sm font-medium transition-colors',
            currentStep === i
              ? 'text-primary'
              : currentStep > i
                ? 'text-success'
                : 'text-gray-400 dark:text-gray-500'
          ]"
        >
          {{ step }}
        </span>
      </div>
      <div
        v-if="i < steps.length - 1"
        :class="[
          'w-16 h-0.5 mx-3 transition-colors',
          currentStep > i ? 'bg-success' : 'bg-gray-200 dark:bg-dark-border'
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
