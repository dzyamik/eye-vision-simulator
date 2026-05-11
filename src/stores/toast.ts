// Tiny global toast queue. Lives in Pinia rather than a composable because
// dev-docs/06-state-management.md prefers Pinia for non-local UI state, and
// because any module (stores, composables, components) can call
// useToastStore().push(...) without prop drilling.

import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ToastType = 'info' | 'error';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

export interface ToastOptions {
  type?: ToastType;
  /** 0 to disable auto-dismiss. */
  durationMs?: number;
}

const DEFAULT_DURATION_MS = 4000;

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([]);
  const timers = new Map<number, ReturnType<typeof setTimeout>>();
  let nextId = 0;

  function push(message: string, opts: ToastOptions = {}): number {
    const id = ++nextId;
    toasts.value.push({ id, message, type: opts.type ?? 'info' });

    const duration = opts.durationMs ?? DEFAULT_DURATION_MS;
    if (duration > 0) {
      timers.set(
        id,
        setTimeout(() => dismiss(id), duration),
      );
    }
    return id;
  }

  function dismiss(id: number): void {
    const timer = timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.delete(id);
    }
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return { toasts, push, dismiss };
});
