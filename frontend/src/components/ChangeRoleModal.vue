<template>
  <div class="fixed inset-0 flex items-center justify-center z-50 p-4" style="background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px);">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">Change Role</h2>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <!-- Member Info -->
        <div class="p-4 bg-gray-50 rounded-lg">
          <p class="text-sm font-medium text-gray-900">{{ member.user.name }}</p>
          <p class="text-sm text-gray-600">{{ member.user.email }}</p>
        </div>

        <!-- Role -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            New Role <span class="text-red-500">*</span>
          </label>
          <select
            v-model="newRole"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <p class="mt-1 text-xs text-gray-500">
            Current role: <span class="font-semibold">{{ member.role.toUpperCase() }}</span>
          </p>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-600">{{ errorMessage }}</p>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 border border-gray-200 text-gray-700 bg-white hover:bg-gray-100 rounded-lg font-medium text-sm transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading || newRole === member.role"
            class="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading">Updating...</span>
            <span v-else>Update Role</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useTeamsStore, type TeamMember } from '../stores/teams';

interface Props {
  teamId: number;
  member: TeamMember;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  updated: [];
}>();

const teamsStore = useTeamsStore();

const newRole = ref<'member' | 'admin'>(props.member.role === 'admin' ? 'admin' : 'member');
const loading = ref(false);
const errorMessage = ref('');

const handleSubmit = async () => {
  errorMessage.value = '';
  loading.value = true;
  
  try {
    await teamsStore.updateMemberRole(props.teamId, props.member.user_id, newRole.value);
    emit('updated');
  } catch (error: any) {
    errorMessage.value = error.response?.data?.error || teamsStore.error || 'Failed to update role';
  } finally {
    loading.value = false;
  }
};
</script>
