<script setup lang="ts">
// Bottom-right stack of dismissible toasts. Renders the contents of
// useToastStore; mounted once in AppShell so it overlays everything.

import { storeToRefs } from 'pinia';

import { useToastStore } from '@/stores/toast';

const store = useToastStore();
const { toasts } = storeToRefs(store);
</script>

<template>
  <div class="toaster" aria-live="polite" aria-atomic="false">
    <transition-group name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="toast"
        :class="`toast--${t.type}`"
        role="status"
      >
        <span class="message">{{ t.message }}</span>
        <button
          type="button"
          class="dismiss"
          aria-label="Dismiss notification"
          @click="store.dismiss(t.id)"
        >
          ×
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toaster {
  position: fixed;
  right: var(--pad);
  bottom: var(--pad);
  display: flex;
  flex-direction: column;
  gap: var(--pad-sm);
  z-index: 100;
  max-width: min(360px, calc(100vw - 2 * var(--pad)));
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: var(--pad-sm);
  padding: var(--pad-sm) var(--pad);
  background: var(--bg-3);
  color: var(--fg);
  border: 1px solid var(--border);
  border-left-width: 3px;
  border-radius: var(--radius-sm);
  font-size: var(--t-sm);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  pointer-events: auto;
}

.toast--info {
  border-left-color: var(--accent);
}

.toast--error {
  border-left-color: var(--danger);
}

.message {
  flex: 1;
  word-break: break-word;
}

.dismiss {
  color: var(--fg-dim);
  font-size: var(--t-lg);
  line-height: 1;
  padding: 0 4px;
}

.dismiss:hover {
  color: var(--fg);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}
</style>
