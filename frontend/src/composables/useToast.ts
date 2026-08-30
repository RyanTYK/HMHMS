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

// ToastContainer renders messages with v-html so callers can bold/line-break
// (e.g. `<strong>Test failed</strong><br/>${msg}`). Any dynamic value
// interpolated into a message - a monitor name, a target, an error string -
// must be escaped with this first, or it's a stored XSS vector: monitor
// name/target are fully user-controlled and get embedded as raw HTML the
// next time a toast references them (create/update/delete/test).
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default useToast;
