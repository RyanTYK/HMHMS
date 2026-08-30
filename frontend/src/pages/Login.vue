<template>
  <div class="relative min-h-screen">
    <div class="absolute inset-0">
      <img src="/background.png" alt="Background" class="w-full h-full object-cover" />
    </div>

    <!-- Foreground content -->
    <div class="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
      <div class="mb-8">
        <img src="/centific-logo.png" alt="Logo" class="w-20 h-20 object-contain" />
      </div>
      <h1 class="text-4xl md:text-5xl text-white font-light mb-2">
        Welcome
      </h1>
      <h1 class="text-4xl md:text-5xl text-pink-500 font-semibold mb-8">
        Back!
      </h1>

      <!-- Form -->
      <form @submit.prevent="onSubmit" class="w-full max-w-md space-y-4">

        <div>
  <div :class="['flex items-center bg-white/10 backdrop-blur-md text-white rounded-xl border transition-all placeholder-gray-400 mb-2 px-4 shadow-md', touched.email && errors.email ? 'border-pink-400' : 'border-white/20 focus-within:border-pink-400/40']">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="4"/>
            <path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94"/>
          </svg>
          <input
            ref="emailInput"
            v-model="email"
            type="email"
            placeholder="Email Address"
            @keydown.enter.prevent="focusPassword"
            @blur="markFieldTouched('email')"
            class="flex-1 bg-transparent text-white outline-none py-4 placeholder-gray-400 border-none focus:ring-0 appearance-none rounded-none" style="border:none;outline:none;box-shadow:none;border-radius:0;background:transparent;"
            required
          />
        </div>
        <span v-if="touched.email && errors.email" class="text-pink-300 text-sm font-medium block mb-2 animate-slideDown">{{ errors.email }}</span>
        </div>

        <div>
  <div :class="['flex items-center bg-white/10 backdrop-blur-md text-white rounded-xl border transition-all placeholder-gray-400 mb-2 px-4 shadow-md', touched.password && errors.password ? 'border-pink-400' : 'border-white/20 focus-within:border-pink-400/40']">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="5" y="11" width="14" height="10" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <input
            ref="passwordInput"
            :type="showPassword ? 'text' : 'password'"
            v-model="password"
            placeholder="Password"
            @blur="markFieldTouched('password')"
            class="flex-1 bg-transparent text-white outline-none py-4 placeholder-gray-400 border-none focus:ring-0 appearance-none rounded-none" style="border:none;outline:none;box-shadow:none;border-radius:0;background:transparent;"
            required
          />
          <button type="button" class="ml-3 text-gray-400 hover:text-gray-300" @click="showPassword = !showPassword" aria-label="Toggle password visibility">
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
        <span v-if="touched.password && errors.password" class="text-pink-300 text-sm font-medium block mb-4 animate-slideDown">{{ errors.password }}</span>
        </div>

        <button type="submit" class="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white py-4 rounded-xl font-bold text-base tracking-wider transition-all shadow-lg mt-6 cursor-pointer relative z-10">
          LOG IN
        </button>

        <div class="flex items-center my-6">
          <div class="flex-1 border-t border-white/20"></div>
          <span class="px-4 text-sm text-gray-400 italic">OR</span>
          <div class="flex-1 border-t border-white/20"></div>
        </div>

        <button
          type="button"
          @click="handleMicrosoftSSO"
          class="w-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 text-white py-4 rounded-xl font-semibold text-base transition-all shadow-md flex items-center justify-center gap-3"
        >
          <svg class="w-5 h-5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0H11V11H0V0Z" fill="#F25022"/>
            <path d="M12 0H23V11H12V0Z" fill="#7FBA00"/>
            <path d="M0 12H11V23H0V12Z" fill="#00A4EF"/>
            <path d="M12 12H23V23H12V12Z" fill="#FFB900"/>
          </svg>
          <span>Sign in with Microsoft</span>
        </button>

        <p class="text-sm text-gray-300 text-center mt-5">
          <span class="italic">Don't have an account?</span>
          <router-link class="text-pink-500 hover:text-pink-400 font-semibold ml-1" to="/register">Sign up</router-link>
        </p>

        <p v-if="error" class="text-sm text-red-400 text-center mt-2">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const error = ref('');
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const emailInput = ref<HTMLInputElement | null>(null);
const passwordInput = ref<HTMLInputElement | null>(null);

type ValidationErrors = {
  email?: string;
  password?: string;
};

const errors = ref<ValidationErrors>({});
const touched = ref<Record<string, boolean>>({});

onMounted(() => {
  const savedEmail = localStorage.getItem('lastLoginEmail');
  if (savedEmail) {
    email.value = savedEmail;
  }
});

function validateEmail() {
  if (!email.value || email.value.trim() === '') {
    errors.value.email = 'Email is required';
    return false;
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email.value)) {
    errors.value.email = 'Please enter a valid email address';
    return false;
  }
  if (email.value.includes(' ')) {
    errors.value.email = 'Email cannot contain spaces';
    return false;
  }
  errors.value.email = undefined;
  return true;
}

function validatePassword() {
  // No length check here: this is login, not registration, and a length
  // minimum would lock out any account whose real password predates the
  // rule. The backend is the source of truth for whether it's correct.
  if (!password.value || password.value.trim() === '') {
    errors.value.password = 'Password is required';
    return false;
  }
  errors.value.password = undefined;
  return true;
}

function validateForm(): boolean {
  const validations = [
    validateEmail(),
    validatePassword(),
  ];
  return validations.every(v => v);
}

function markFieldTouched(field: string) {
  touched.value[field] = true;
}

watch(() => email.value, () => {
  if (touched.value.email) validateEmail();
});

watch(() => password.value, () => {
  if (touched.value.password) validatePassword();
});

function focusPassword() {
  passwordInput.value?.focus();
}

async function onSubmit() {
  error.value = '';

  touched.value = {
    email: true,
    password: true,
  };

  if (!validateForm()) {
    return;
  }

  try {
    await authStore.login(email.value, password.value);
    // Save email for next time
    localStorage.setItem('lastLoginEmail', email.value);
    const redirect = (route.query.redirect as string) || '/';
    router.replace(redirect);
  } catch (e: any) {
    error.value = e?.message || 'Login failed';
  }
}

function handleMicrosoftSSO() {
  authStore.initiateMicrosoftSSO();
}
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
