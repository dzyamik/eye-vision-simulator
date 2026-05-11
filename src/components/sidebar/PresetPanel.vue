<script setup lang="ts">
// Built-in presets list + JSON export/import (9.2). Clicking a built-in
// preset replaces both eyes' settings via usePresetsStore.load(preset).
// Export downloads the current state as JSON (mask included as base64
// PNG); Import restores from a picked JSON file.

import { storeToRefs } from 'pinia';
import { ref } from 'vue';

import { usePresetsStore } from '@/stores/presets';
import { useToastStore } from '@/stores/toast';

const presets = usePresetsStore();
const toast = useToastStore();
const { builtIn } = storeToRefs(presets);

const fileInput = ref<HTMLInputElement | null>(null);

function onExport(): void {
  try {
    const json = presets.exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eye-vision-preset-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    toast.push(`Export failed: ${(err as Error).message}`, { type: 'error' });
  }
}

function openImportPicker(): void {
  fileInput.value?.click();
}

async function onImportPicked(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  // Reset so picking the same file twice in a row still fires `change`.
  input.value = '';
  if (file === undefined) return;
  try {
    const text = await file.text();
    await presets.importJson(text);
    toast.push('Preset imported.');
  } catch (err) {
    toast.push(`Import failed: ${(err as Error).message}`, { type: 'error' });
  }
}
</script>

<template>
  <section class="preset-panel">
    <header class="header">
      <h3 class="title">Presets</h3>
      <span class="hint">Replaces both eyes' settings.</span>
    </header>

    <div class="list">
      <button
        v-for="p in builtIn"
        :key="p.id"
        type="button"
        class="preset-btn"
        @click="presets.load(p)"
      >
        {{ p.name }}
      </button>
    </div>

    <div class="io">
      <button type="button" class="io-btn" @click="onExport">Export JSON</button>
      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json"
        class="file-input"
        @change="onImportPicked"
      />
      <button type="button" class="io-btn" @click="openImportPicker">Import JSON</button>
    </div>
  </section>
</template>

<style scoped>
.preset-panel {
  display: flex;
  flex-direction: column;
  gap: var(--pad-sm);
  padding: var(--pad);
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.header {
  display: flex;
  align-items: baseline;
  gap: var(--pad-sm);
  flex-wrap: wrap;
}

.title {
  font-size: var(--t);
  font-weight: 600;
  color: var(--fg);
  margin: 0;
}

.hint {
  font-size: var(--t-sm);
  color: var(--fg-dim);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preset-btn {
  background: var(--bg-3);
  color: var(--fg);
  padding: 6px 10px;
  font-size: var(--t-sm);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  text-align: left;
  cursor: pointer;
}

.preset-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.io {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  margin-top: var(--pad-sm);
}

.io-btn {
  background: var(--bg-3);
  color: var(--fg);
  padding: 6px 0;
  font-size: var(--t-sm);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.io-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.file-input {
  display: none;
}
</style>
