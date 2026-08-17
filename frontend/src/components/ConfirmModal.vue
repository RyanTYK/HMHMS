<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="confirm-modal">
      <!-- Animated Warning Icon -->
      <div class="icon-container">
        <div class="warning-circle">
          <svg class="warning-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div class="warning-pulse"></div>
      </div>

      <!-- Content -->
      <div class="modal-content">
        <h2 class="modal-title">{{ title || 'Confirm Deletion' }}</h2>
        <p class="modal-message">{{ message }}</p>
        <p v-if="!hideWarning" class="modal-warning">This action cannot be undone.</p>
      </div>

      <!-- Action Buttons -->
      <div class="modal-actions">
        <button 
          v-if="showCancel"
          type="button" 
          class="btn btn-cancel" 
          @click="emit('cancel')"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          Cancel
        </button>
        <button 
          type="button" 
          :class="['btn', confirmClass === 'default' ? 'btn-cancel' : 'btn-delete']" 
          @click="emit('confirm')"
        >
          <svg v-if="confirmClass !== 'default'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          {{ confirmText || 'Yes, Delete' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  title?: string;
  subtitle?: string;
  message: string;
  confirmText?: string;
  confirmClass?: 'default' | 'danger';
  showCancel?: boolean;
  hideWarning?: boolean;
}>(), {
  showCancel: true
});
const emit = defineEmits<{ (e: 'close'): void; (e: 'confirm'): void; (e: 'cancel'): void }>();
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 9999;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.confirm-modal {
  background: white;
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(204, 19, 137, 0.25);
  width: 100%;
  max-width: 480px;
  padding: 40px 32px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 2px solid #fae7f3;
  position: relative;
  overflow: hidden;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Decorative gradient background */
.confirm-modal::before {
  content: '';
  position: absolute;
  top: -100px;
  right: -100px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(204, 19, 137, 0.12) 0%, transparent 70%);
  pointer-events: none;
}

.confirm-modal::after {
  content: '';
  position: absolute;
  bottom: -100px;
  left: -100px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(163, 15, 110, 0.08) 0%, transparent 70%);
  pointer-events: none;
}

.icon-container {
  position: relative;
  margin-bottom: 24px;
  z-index: 1;
}

.warning-circle {
  width: 96px;
  height: 96px;
  background: linear-gradient(135deg, #fae7f3 0%, #f5d0e7 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  animation: bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 8px 20px rgba(204, 19, 137, 0.25);
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.warning-icon {
  color: #cc1389;
  animation: shake 2s ease-in-out infinite;
}

@keyframes shake {
  0%, 100% {
    transform: rotate(0deg);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: rotate(-3deg);
  }
  20%, 40%, 60%, 80% {
    transform: rotate(3deg);
  }
}

.warning-pulse {
  position: absolute;
  inset: -8px;
  border: 3px solid #f0b8dc;
  border-radius: 50%;
  animation: pulse 2s ease-out infinite;
  z-index: 1;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.3);
    opacity: 0;
  }
}

.modal-content {
  text-align: center;
  margin-bottom: 32px;
  z-index: 1;
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12px;
  animation: fadeInDown 0.4s ease-out 0.1s both;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-message {
  font-size: 16px;
  color: #4b5563;
  margin-bottom: 8px;
  line-height: 1.6;
  animation: fadeInDown 0.4s ease-out 0.2s both;
}

.modal-warning {
  font-size: 14px;
  color: #cc1389;
  font-weight: 500;
  animation: fadeInDown 0.4s ease-out 0.3s both;
}

.modal-actions {
  display: flex;
  gap: 12px;
  width: 100%;
  z-index: 1;
  animation: fadeInUp 0.4s ease-out 0.4s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.btn {
  flex: 1;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-cancel {
  background: white;
  color: #6b7280;
  border: 2px solid #f0b8dc;
  box-shadow: 0 2px 4px rgba(204, 19, 137, 0.08);
}

.btn-cancel:hover {
  background: #fae7f3;
  color: #8f0d60;
  border-color: #eba1d0;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(204, 19, 137, 0.15);
}

.btn-cancel:active {
  transform: translateY(0);
}

.btn-delete {
  background: linear-gradient(135deg, #cc1389 0%, #a30f6e 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(204, 19, 137, 0.35);
  position: relative;
  overflow: hidden;
}

.btn-delete::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.2s;
}

.btn-delete:hover {
  background: linear-gradient(135deg, #b8117b 0%, #8f0d60 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(204, 19, 137, 0.45);
}

.btn-delete:hover::before {
  opacity: 1;
}

.btn-delete:active {
  transform: translateY(0);
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .confirm-modal {
    padding: 32px 24px 24px;
  }

  .warning-circle {
    width: 80px;
    height: 80px;
  }

  .warning-icon {
    width: 48px;
    height: 48px;
  }

  .modal-title {
    font-size: 20px;
  }

  .modal-message {
    font-size: 14px;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }
}
</style>
