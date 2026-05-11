<script setup lang="ts">
// Top-of-sidebar segmented toggle. Driven by useViewSettingsStore.activeEye;
// "Both" also flips useEyeSettingsStore.linked, which a future useEyeParam
// composable (Phase 5.2+) reads to decide whether a slider write should
// propagate to both eyes or just the active one.

import { storeToRefs } from 'pinia';

import { useEyeSettingsStore } from '@/stores/eyeSettings';
import type { ActiveEye } from '@/stores/viewSettings';
import { useViewSettingsStore } from '@/stores/viewSettings';

const view = useViewSettingsStore();
const eye = useEyeSettingsStore();
const { activeEye } = storeToRefs(view);

interface Option {
  value: ActiveEye;
  label: string;
}

const options: readonly Option[] = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'both', label: 'Both' },
] as const;

function select(value: ActiveEye): void {
  view.activeEye = value;
  eye.linked = value === 'both';
}
</script>

<template>
  <div class="eye-selector" role="tablist" aria-label="Active eye">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      role="tab"
      class="seg"
      :class="{ 'seg--active': activeEye === opt.value }"
      :aria-selected="activeEye === opt.value"
      @click="select(opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.eye-selector {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.seg {
  background: var(--bg-3);
  color: var(--fg-dim);
  padding: 8px 0;
  font-size: var(--t-sm);
  font-weight: 500;
  border: none;
  border-right: 1px solid var(--border);
  cursor: pointer;
  transition:
    background 120ms ease,
    color 120ms ease;
}

.seg:last-child {
  border-right: none;
}

.seg:hover:not(.seg--active) {
  color: var(--fg);
  background: color-mix(in srgb, var(--bg-3) 80%, var(--accent) 20%);
}

.seg--active {
  background: var(--accent);
  color: var(--bg);
}
</style>
