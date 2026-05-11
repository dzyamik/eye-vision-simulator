<script setup lang="ts">
// TopBar: branding, sample-image dropdown (wired in 3.4), Upload button, and
// a hamburger that emits "toggle-sidebar" on small screens. The Upload button
// triggers a hidden file input; on selection we delegate to image.setFromFile
// and surface any error (e.g. file > 10 MB) via the toast queue.

import { ref } from 'vue';

import { useImageStore } from '@/stores/image';
import { useToastStore } from '@/stores/toast';

defineEmits<{ 'toggle-sidebar': [] }>();

const image = useImageStore();
const toast = useToastStore();
const fileInput = ref<HTMLInputElement | null>(null);

function openPicker(): void {
  fileInput.value?.click();
}

async function onPicked(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  // Reset so picking the same filename twice in a row still fires `change`.
  input.value = '';
  if (!file) return;
  try {
    await image.setFromFile(file);
  } catch (err) {
    toast.push((err as Error).message, { type: 'error' });
  }
}
</script>

<template>
  <header class="top-bar">
    <button
      type="button"
      class="hamburger"
      aria-label="Toggle sidebar"
      @click="$emit('toggle-sidebar')"
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      >
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>

    <h1 class="brand">Eye Vision Simulator</h1>

    <div class="actions">
      <select class="sample-select" disabled aria-label="Sample images">
        <option>Sample images…</option>
      </select>

      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="file-input"
        @change="onPicked"
      />
      <button type="button" class="upload" @click="openPicker">Upload</button>
    </div>
  </header>
</template>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  gap: var(--pad);
  padding: var(--pad-sm) var(--pad);
  background: var(--bg-2);
  border-bottom: 1px solid var(--border);
  min-height: 48px;
}

.brand {
  font-size: var(--t-lg);
  font-weight: 600;
  letter-spacing: 0.02em;
  margin: 0;
  color: var(--fg);
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--pad-sm);
  margin-left: auto;
}

.sample-select,
.upload {
  background: var(--bg-3);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  font-size: var(--t-sm);
}

.upload:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.sample-select:disabled,
.upload:disabled {
  color: var(--fg-dim);
  cursor: not-allowed;
}

.file-input {
  display: none;
}

.hamburger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  color: var(--fg);
}

.hamburger:hover {
  background: var(--bg-3);
}

@media (min-width: 900px) {
  /* Sidebar is permanently visible on desktop, so the hamburger is dead weight. */
  .hamburger {
    display: none;
  }
}
</style>
