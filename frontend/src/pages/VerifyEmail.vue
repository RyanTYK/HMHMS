<template>
  <div class="relative min-h-screen">
    <!-- Background Image -->
    <div class="absolute inset-0">
      <img 
        src="/background.png" 
        alt="Background" 
        class="w-full h-full object-cover" 
      />
    </div>
    
    <!-- Content -->
    <div class="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
      
      <!-- Loading State -->
      <div v-if="loading" class="text-white text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-2 border-t-pink-500 border-r-pink-500 border-b-transparent border-l-transparent mx-auto mb-6"></div>
        <p class="text-xl font-medium">Verifying your email...</p>
        <p class="text-white/60 mt-3 text-sm">Please wait a moment</p>
      </div>
      
      <!-- Success State -->
      <div v-else-if="success" class="text-center max-w-md">
        <div class="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20" style="padding: 48px 24px;">
          <div class="w-16 h-16 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <h1 class="text-3xl text-white font-medium mb-4">Email Verified!</h1>
          <p class="text-white/80 text-base leading-relaxed mb-10 px-4">
            Your account has been verified successfully. You can now log in and start monitoring your services.
          </p>
          
          <div style="margin-top: 40px;">
            <router-link 
              to="/login" 
              class="inline-block bg-pink-500 hover:bg-[#b8117b] text-white font-medium rounded-lg transition-colors duration-200"
              style="padding: 12px 32px;"
            >
              Go to Login
            </router-link>
          </div>
        </div>
      </div>
      
      <!-- Error State -->
      <div v-else class="text-center max-w-md">
        <div class="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20" style="padding: 48px 24px;">
          <div class="w-16 h-16 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          
          <h1 class="text-3xl text-white font-medium mb-6">Verification Failed</h1>
          <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 mx-4">
            <p class="text-red-400 font-normal text-sm">{{ error }}</p>
          </div>
          
          <p class="text-white/70 mb-6 px-4 text-sm leading-relaxed">
            The verification link may have expired or is invalid. Enter your email below to get a new link.
          </p>

          <div class="px-4 mb-6">
            <input
              v-model="resendEmail"
              type="email"
              placeholder="you@example.com"
              class="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 px-4 py-2.5 focus:outline-none focus:border-pink-500"
            />
            <button
              @click="resendVerification"
              :disabled="resendCooldown > 0 || isResending || !resendEmail"
              class="mt-3 w-full rounded-lg font-medium transition-colors duration-200 py-2.5"
              :class="resendCooldown > 0 || isResending || !resendEmail ? 'bg-white/10 text-white/50' : 'bg-pink-500 hover:bg-[#b8117b] text-white'"
            >
              <span v-if="isResending">Sending…</span>
              <span v-else-if="resendCooldown > 0">Resend in {{ resendCooldown }}s</span>
              <span v-else>Resend Verification Email</span>
            </button>
            <p v-if="resendMessage" class="text-green-400 text-sm mt-3">{{ resendMessage }}</p>
            <p v-if="resendError" class="text-red-400 text-sm mt-3">{{ resendError }}</p>
          </div>

          <div class="flex gap-3 justify-center px-4" style="margin-top: 24px;">
            <router-link
              to="/register"
              class="inline-block bg-pink-500 hover:bg-[#b8117b] text-white font-medium rounded-lg transition-colors duration-200"
              style="padding: 12px 24px;"
            >
              Back to Register
            </router-link>

            <router-link
              to="/login"
              class="inline-block bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors duration-200 border border-white/20"
              style="padding: 12px 24px;"
            >
              Try Login
            </router-link>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const loading = ref(true);
const success = ref(false);
const error = ref('');

const resendEmail = ref('');
const isResending = ref(false);
const resendCooldown = ref(0);
const resendMessage = ref('');
const resendError = ref('');
let cooldownTimer: number | null = null;

function startResendCooldown() {
  resendCooldown.value = 90; // 90 seconds cooldown

  if (cooldownTimer) {
    clearInterval(cooldownTimer);
  }

  cooldownTimer = setInterval(() => {
    resendCooldown.value--;
    if (resendCooldown.value <= 0) {
      if (cooldownTimer) clearInterval(cooldownTimer);
    }
  }, 1000);
}

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer);
});

async function resendVerification() {
  if (resendCooldown.value > 0 || isResending.value || !resendEmail.value) return;

  isResending.value = true;
  resendMessage.value = '';
  resendError.value = '';

  try {
    const API_URL = import.meta.env.VITE_API_URL ?? '';
    const res = await fetch(`${API_URL}/api/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resendEmail.value })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to resend verification email');

    resendMessage.value = data.message || 'Verification email sent. Please check your inbox.';
    startResendCooldown();
  } catch (e: any) {
    resendError.value = e?.message || 'Failed to resend verification email';
  } finally {
    isResending.value = false;
  }
}

onMounted(async () => {
  const token = route.query.token;
  
  if (!token) {
    loading.value = false;
    error.value = 'Invalid verification link. No token provided.';
    return;
  }
  
  try {
    const API_URL = import.meta.env.VITE_API_URL ?? '';
    const response = await axios.post(`${API_URL}/api/auth/verify-email`, {
      token: token as string 
    });
    
    if (response.data.success) {
      success.value = true;
    } else {
      error.value = response.data.error || 'Verification failed';
    }
  } catch (e: any) {
    console.error('Verification error:', e);
    error.value = e.response?.data?.error || 'Failed to verify email. Please try again.';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
/* Chrome/Edge/Safari paint autofilled inputs with their own opaque
   background (white/light-blue), ignoring the page's own background-color -
   the only reliable override is an inset box-shadow large enough to cover
   the field, plus -webkit-text-fill-color since `color` is ignored too. */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 1000px #141420 inset;
  box-shadow: 0 0 0 1000px #141420 inset;
  -webkit-text-fill-color: #ffffff;
  caret-color: #ffffff;
  transition: background-color 9999s ease-in-out 0s;
}
</style>
