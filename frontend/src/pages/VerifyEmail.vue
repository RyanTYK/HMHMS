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
          
          <p class="text-white/70 mb-10 px-4 text-sm leading-relaxed">
            The verification link may have expired or is invalid. Please try registering again.
          </p>
          
          <div class="flex gap-3 justify-center px-4" style="margin-top: 40px;">
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
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const loading = ref(true);
const success = ref(false);
const error = ref('');

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
/* Add any additional styles if needed */
</style>
