<template>
  <div class="relative min-h-screen">
    <!-- Background -->
    <div class="absolute inset-0">
      <img src="/background.png" alt="Background" class="w-full h-full object-cover" />

    </div>

    <!-- Foreground content -->
    <div class="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
      <!-- Title -->
      <h1 class="text-4xl md:text-5xl text-white font-light mb-2">
        Create an
      </h1>
      <h1 class="text-4xl md:text-5xl text-pink-500 font-semibold mb-8">
        Account!
      </h1>

      <!-- Form -->
      <div class="w-full max-w-md space-y-4">
        
        <!-- Success Message -->
        <div v-if="registered" class="bg-green-500/20 backdrop-blur-md border border-green-500/50 rounded-xl p-4 mb-6 shadow-lg">
          <div class="flex items-start gap-3">
            <svg class="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div class="flex-1">
              <p class="text-white font-semibold mb-1">Registration Successful!</p>
              <p class="text-white/90 text-sm">
                We've sent a verification email to <strong>{{ email }}</strong>. 
                Please check your inbox and click the verification link to complete your registration.
              </p>
              <p class="text-white/70 text-xs mt-2 italic">
                Don't forget to check your spam folder if you don't see it within a few minutes.
              </p>
            </div>
          </div>
          
          <!-- Resend Button -->
          <div class="mt-3 text-center">
            <button
              @click="resendVerification"
              :disabled="resendCooldown > 0 || isResending"
              class="text-xs font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              :class="resendCooldown > 0 || isResending ? 'bg-white/10 text-white/50' : 'bg-white/20 text-white hover:bg-white/30'"
            >
              <span v-if="isResending" class="flex items-center gap-2 justify-center">
                <svg class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
              <span v-else-if="resendCooldown > 0">
                Resend in {{ resendCooldown }}s
              </span>
              <span v-else>
                Resend Verification Email
              </span>
            </button>
          </div>
        </div>
        
        <!-- Name -->
        <div class="flex items-center bg-white/10 backdrop-blur-md text-white rounded-xl transition-all placeholder-gray-400 mb-4 px-4 shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <input
            v-model="name"
            type="text"
            placeholder="Username"
            class="flex-1 bg-transparent text-white outline-none py-4 placeholder-gray-400 border-none focus:ring-0 appearance-none rounded-none" style="border:none;outline:none;box-shadow:none;border-radius:0;background:transparent;"
            required
            :disabled="isLoading"
          />
        </div>

        <!-- Email -->
        <div class="flex items-center bg-white/10 backdrop-blur-md text-white rounded-xl transition-all placeholder-gray-400 mb-4 px-4 shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="4"/>
            <path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94"/>
          </svg>
          <input
            v-model="email"
            type="email"
            placeholder="Email Adress"
            class="flex-1 bg-transparent text-white outline-none py-4 placeholder-gray-400 border-none focus:ring-0 appearance-none rounded-none" style="border:none;outline:none;box-shadow:none;border-radius:0;background:transparent;"
            required
            :disabled="isLoading"
          />
        </div>

        <!-- Password -->
        <div class="flex items-center bg-white/10 backdrop-blur-md text-white rounded-xl transition-all placeholder-gray-400 mb-4 px-4 shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="5" y="11" width="14" height="10" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <input
            :type="showPassword ? 'text' : 'password'"
            v-model="password"
            placeholder="Password"
            class="flex-1 bg-transparent text-white outline-none py-4 placeholder-gray-400 border-none focus:ring-0 appearance-none rounded-none" style="border:none;outline:none;box-shadow:none;border-radius:0;background:transparent;"
            required
            :disabled="isLoading"
          />
          <button type="button" class="ml-3 text-gray-400 hover:text-gray-300" @click="showPassword = !showPassword" aria-label="Toggle password visibility" :disabled="isLoading">
            <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          </button>
        </div>

        <!-- Confirm Password -->
        <div class="flex items-center bg-white/10 backdrop-blur-md text-white rounded-xl transition-all placeholder-gray-400 mb-6 px-4 shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="5" y="11" width="14" height="10" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <input
            :type="showConfirm ? 'text' : 'password'"
            v-model="confirm"
            placeholder="Confirm Password"
            class="flex-1 bg-transparent text-white outline-none py-4 placeholder-gray-400 border-none focus:ring-0 appearance-none rounded-none" style="border:none;outline:none;box-shadow:none;border-radius:0;background:transparent;"
            required
            :disabled="isLoading"
          />
          <button type="button" class="ml-3 text-gray-400 hover:text-gray-300" @click="showConfirm = !showConfirm" aria-label="Toggle confirm visibility" :disabled="isLoading">
            <svg v-if="!showConfirm" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          </button>
        </div>

        <!-- Button -->
        <button 
          type="submit" 
          @click.prevent="onSubmit" 
          :disabled="isLoading"
          class="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white py-4 rounded-xl font-bold text-base tracking-wider transition-all shadow-lg mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-pink-500 disabled:hover:to-pink-600 flex items-center justify-center gap-2"
        >
          <svg v-if="isLoading" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ isLoading ? 'REGISTERING...' : 'REGISTER' }}</span>
        </button>

        <!-- Divider -->
        <div class="flex items-center my-6">
          <div class="flex-1 border-t border-white/20"></div>
          <span class="px-4 text-sm text-gray-400 italic">OR</span>
          <div class="flex-1 border-t border-white/20"></div>
        </div>

        <!-- Microsoft SSO Button -->
        <button 
          type="button"
          @click="handleMicrosoftSSO"
          :disabled="isLoading"
          class="w-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 text-white py-4 rounded-xl font-semibold text-base transition-all shadow-md flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg class="w-5 h-5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0H11V11H0V0Z" fill="#F25022"/>
            <path d="M12 0H23V11H12V0Z" fill="#7FBA00"/>
            <path d="M0 12H11V23H0V12Z" fill="#00A4EF"/>
            <path d="M12 12H23V23H12V12Z" fill="#FFB900"/>
          </svg>
          <span>Sign up with Microsoft</span>
        </button>

        <!-- Footer link -->
        <p class="text-sm text-gray-300 text-center mt-5">
          <span class="italic">Already have an account?</span>
          <router-link class="text-pink-500 hover:text-pink-400 font-semibold ml-1" to="/login">Sign in</router-link>
        </p>

        <p v-if="error" class="text-sm text-red-400 text-center mt-2">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const name = ref('');
const email = ref('');
const password = ref('');
const confirm = ref('');
const showPassword = ref(false);
const showConfirm = ref(false);
const error = ref('');
const registered = ref(false);
const isLoading = ref(false);
const isResending = ref(false);
const resendCooldown = ref(0);
let cooldownTimer: number | null = null;
const router = useRouter();

async function onSubmit() {
  error.value = '';
  registered.value = false;
  isLoading.value = true;
  
  try {
    if (password.value !== confirm.value) {
      throw new Error('Passwords do not match');
    }
    
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.value, email: email.value, password: password.value })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Register failed');
    
    // Show success message instead of auto-login
    registered.value = true;
    
    // Start cooldown timer
    startResendCooldown();
    
    // Clear password fields for security
    password.value = '';
    confirm.value = '';
    
  } catch (e: any) {
    error.value = e?.message || 'Register failed';
  } finally {
    isLoading.value = false;
  }
}

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

async function resendVerification() {
  if (resendCooldown.value > 0 || isResending.value) return;
  
  isResending.value = true;
  error.value = '';
  
  try {
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to resend verification email');
    
    // Start cooldown again
    startResendCooldown();
    
  } catch (e: any) {
    error.value = e?.message || 'Failed to resend verification email';
  } finally {
    isResending.value = false;
  }
}

function handleMicrosoftSSO() {
  // Placeholder for Microsoft SSO implementation
  // Will be implemented once Azure app registration is complete
  console.log('Microsoft SSO - Coming Soon');
}
</script>
