<template>
  <div :class="{ dark: isDark }" class="min-h-screen bg-light-bg dark:bg-dark-bg transition-colors duration-300">
    <Navbar :isDark="isDark" @toggle-dark="toggleDark" />
    <Dashboard />
    <Footer />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Navbar from './components/Navbar.vue';
import Dashboard from './views/Dashboard.vue';
import Footer from './components/Footer.vue';

const isDark = ref(localStorage.getItem('dark-mode') === 'true');

function toggleDark() {
  isDark.value = !isDark.value;
  localStorage.setItem('dark-mode', isDark.value);
  document.documentElement.classList.toggle('dark', isDark.value);
}
</script>
