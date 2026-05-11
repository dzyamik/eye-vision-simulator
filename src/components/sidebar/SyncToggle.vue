<script setup lang="ts">
// Single sidebar-wide checkbox: "Sync both eyes". When on, any slider /
// checkbox write to one eye also mirrors to the other (logic lives in
// useEyeParam). When off, the per-condition L/R rows are independent.

import { storeToRefs } from 'pinia';

import { useEyeSettingsStore } from '@/stores/eyeSettings';

const { linked } = storeToRefs(useEyeSettingsStore());
</script>

<template>
  <label class="sync-toggle">
    <input v-model="linked" type="checkbox" class="checkbox" />
    <span class="label">Sync both eyes</span>
    <span class="hint">writes mirror L ↔ R</span>
  </label>
</template>

<style scoped>
.sync-toggle {
  display: flex;
  align-items: center;
  gap: var(--pad-sm);
  padding: var(--pad-sm) var(--pad);
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--t-sm);
  color: var(--fg);
}

.sync-toggle:hover {
  border-color: var(--accent);
}

.checkbox {
  accent-color: var(--accent);
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.label {
  font-weight: 500;
}

.hint {
  margin-left: auto;
  color: var(--fg-dim);
  font-size: var(--t-sm);
}
</style>
