<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col items-end gap-3">
    <transition-group name="toast" tag="div">
      <div v-for="t in toasts" :key="t.id" :class="['max-w-sm w-full px-4 py-2 rounded shadow-lg text-white', typeClass(t.type)]">
        <div class="flex items-start gap-3">
          <div class="flex-1 text-sm" v-html="t.message"></div>
          <button class="ml-2 opacity-80 hover:opacity-100" @click="remove(t.id)">✕</button>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { toasts, removeToast } from '../composables/useToast';

const typeClass = (type?: string) => {
  if (type === 'success') return 'bg-green-600';
  if (type === 'error') return 'bg-red-600';
  return 'bg-gray-800';
};

const remove = (id: number) => removeToast(id);
</script>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all .2s ease; }
.toast-enter-from { opacity: 0; transform: translateY(-6px); }
.toast-enter-to { opacity: 1; transform: translateY(0); }
.toast-leave-from { opacity: 1; transform: translateY(0); }
.toast-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
