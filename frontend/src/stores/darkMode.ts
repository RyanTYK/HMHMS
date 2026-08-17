import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useDarkModeStore = defineStore('darkMode', () => {
  // State
  const isDark = ref(false);

  // Initialize from localStorage or system preference
  function initialize() {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) {
      isDark.value = stored === 'true';
    } else {
      // Check system preference
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    applyDarkMode();
  }

  // Actions
  function toggleDarkMode() {
    isDark.value = !isDark.value;
    applyDarkMode();
  }

  function setDarkMode(value: boolean) {
    isDark.value = value;
    applyDarkMode();
  }

  function applyDarkMode() {
    if (isDark.value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDark.value.toString());
  }

  // Watch for changes and persist
  watch(isDark, () => {
    localStorage.setItem('darkMode', isDark.value.toString());
  });

  // Initialize on store creation
  initialize();

  return {
    isDark,
    toggleDarkMode,
    setDarkMode
  };
});
