import { reactive } from 'vue';

type Toast = {
  id: number;
  message: string;
  type?: 'success' | 'error' | 'info';
};

const state = reactive<{ toasts: Toast[] }>({ toasts: [] });
let nextId = 1;

export function useToast() {
  function add(message: string, type: Toast['type'] = 'info', timeout = 4000) {
    const id = nextId++;
    state.toasts.push({ id, message, type });
    if (timeout > 0) setTimeout(() => remove(id), timeout);
    return id;
  }

  function remove(id: number) {
    const idx = state.toasts.findIndex(t => t.id === id);
    if (idx !== -1) state.toasts.splice(idx, 1);
  }

  return { add, remove, toasts: state.toasts };
}

// Expose module-level helpers for simple imports
export const toasts = state.toasts;
export function addToast(message: string, type: Toast['type'] = 'info', timeout = 4000) {
  return useToast().add(message, type, timeout);
}
export function removeToast(id: number) {
  return useToast().remove(id);
}

export default useToast;
