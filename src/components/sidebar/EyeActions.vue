<script setup lang="ts">
// Sidebar-wide bulk actions: reset one eye's full settings to defaults, or
// copy one eye's full settings to the other. No confirm dialog in v1 — the
// per-slider ↺ button on every RangeInput is the granular undo path; reset
// is the all-at-once nuke for one side.

import { useEyeSettingsStore } from '@/stores/eyeSettings';

const eye = useEyeSettingsStore();
</script>

<template>
  <div class="eye-actions">
    <div class="row">
      <span class="tag">L</span>
      <button type="button" class="btn" @click="eye.resetEye('left')">Reset</button>
      <button type="button" class="btn" @click="eye.copy('left', 'right')">
        Copy → R
      </button>
    </div>
    <div class="row">
      <span class="tag">R</span>
      <button type="button" class="btn" @click="eye.resetEye('right')">Reset</button>
      <button type="button" class="btn" @click="eye.copy('right', 'left')">
        Copy → L
      </button>
    </div>
  </div>
</template>

<style scoped>
.eye-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--pad-sm) var(--pad);
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.row {
  display: grid;
  grid-template-columns: 16px 1fr 1fr;
  gap: var(--pad-sm);
  align-items: center;
}

.tag {
  font-size: var(--t-sm);
  font-family: var(--font-mono);
  color: var(--fg-dim);
  font-weight: 600;
  text-align: center;
}

.btn {
  background: var(--bg-3);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 4px 8px;
  font-size: var(--t-sm);
}

.btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}
</style>
