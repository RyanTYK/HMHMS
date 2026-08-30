<template>
  <div class="relative min-h-screen flex items-center justify-center">
    <!-- Background -->
    <div class="absolute inset-0">
      <img src="/background.png" alt="Background" class="w-full h-full object-cover" />
    </div>

    <!-- Foreground content -->
    <div class="relative z-10 text-center px-6">
      <!-- Logo -->
      <div class="mb-8 flex justify-center">
        <img src="/centific-logo.png" alt="Logo" class="w-20 h-20 object-contain" />
      </div>

      <!-- Loading state -->
      <div v-if="isLoading" class="space-y-6">
        <div class="flex justify-center">
          <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500"></div>
        </div>
        <h2 class="text-2xl text-white font-semibold">Completing Microsoft Sign-In...</h2>
        <p class="text-gray-300">Please wait while we authenticate your account.</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="space-y-6 max-w-md mx-auto">
        <div class="bg-red-500/20 border border-red-500/50 rounded-xl p-6 backdrop-blur-md">
          <svg class="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 class="text-2xl text-white font-semibold mb-3">Authentication Failed</h2>
          <p class="text-red-200 mb-6">{{ error }}</p>
          <router-link 
            to="/login" 
            class="inline-block bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg"
          >
            Return to Login
          </router-link>
        </div>
      </div>

      <!-- Success state (brief display before redirect) -->
      <div v-else-if="success" class="space-y-6">
        <div class="flex justify-center">
          <div class="bg-green-500/20 border border-green-500/50 rounded-full p-4 backdrop-blur-md">
            <svg class="w-16 h-16 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h2 class="text-2xl text-white font-semibold">Successfully Authenticated!</h2>
        <p class="text-gray-300">Redirecting to dashboard...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const isLoading = ref(true);
const error = ref('');
const success = ref(false);

onMounted(async () => {
  try {
    const code = route.query.code as string;
    const errorParam = route.query.error as string;

    if (errorParam) {
      const errorMessages: Record<string, string> = {
        oauth_failed: 'Microsoft authentication failed. Please try again.',
        authentication_failed: 'Could not authenticate your Microsoft account.',
        callback_failed: 'An error occurred during the authentication process.',
      };
      error.value = errorMessages[errorParam] || 'An unknown error occurred.';
      isLoading.value = false;
      return;
    }

    if (!code) {
      error.value = 'No sign-in code received.';
      isLoading.value = false;
      return;
    }

    await authStore.exchangeMicrosoftCode(code);

    // Show success briefly before redirecting
    success.value = true;
    isLoading.value = false;

    // Redirect to dashboard after a short delay
    setTimeout(() => {
      const redirect = (route.query.redirect as string) || '/';
      router.replace(redirect);
    }, 1000);

  } catch (err: any) {
    console.error('Microsoft callback error:', err);
    error.value = err?.message || 'Failed to complete authentication.';
    isLoading.value = false;
  }
});
</script>

<style scoped>
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
