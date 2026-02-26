<template>
  <div class="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12" v-if="!fileData">
    <UploadCard @upload-success="onUploadSuccess" />
  </div>
  <div class="max-w-6xl mx-auto px-4 py-8" v-else>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1">
        <FileSummary :file="fileData" @reset="handleReset" />
      </div>
      <div class="lg:col-span-2">
        <WorksheetPanel :worksheets="fileData.worksheets" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import UploadCard from '../components/UploadCard.vue';
import FileSummary from '../components/FileSummary.vue';
import WorksheetPanel from '../components/WorksheetPanel.vue';

const fileData = ref(null);

function onUploadSuccess(data) {
  fileData.value = data;
}

function handleReset() {
  fileData.value = null;
}
</script>
