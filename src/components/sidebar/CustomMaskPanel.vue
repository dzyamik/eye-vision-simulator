<script setup lang="ts">
// Effect select + intensity slider. The actual paint canvas + maskData
// upload is wired in Phase 8 (8.2 / 8.3). For 5.3 the sidebar shows the
// configuration controls and a "canvas — Phase 8" placeholder.

import { useEyeParam } from '@/composables/useEyeParam';
import type { MaskEffect } from '@/types/eyeSettings';

import ConditionPanel from './ConditionPanel.vue';
import PerEyeRow from './PerEyeRow.vue';
import RangeRow from './RangeRow.vue';

const effectLeft = useEyeParam('left', 'customMask', 'effect');
const effectRight = useEyeParam('right', 'customMask', 'effect');

interface EffectOption {
  value: MaskEffect;
  label: string;
}

const EFFECTS: readonly EffectOption[] = [
  { value: 'darken', label: 'Darken (v1)' },
  { value: 'blur', label: 'Blur (v1.1)' },
  { value: 'desaturate', label: 'Desaturate (v1.1)' },
] as const;
</script>

<template>
  <ConditionPanel
    condition="customMask"
    title="Custom mask"
    info="Paint a per-eye scotoma onto a canvas; the painted alpha becomes a texture that masks the chosen effect to that region."
  >
    <template #default="{ disabledLeft, disabledRight }">
      <PerEyeRow label="Effect" :disabled-left="disabledLeft" :disabled-right="disabledRight">
        <template #left="{ disabled }">
          <select v-model="effectLeft" class="select" :disabled="disabled">
            <option v-for="opt in EFFECTS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </template>
        <template #right="{ disabled }">
          <select v-model="effectRight" class="select" :disabled="disabled">
            <option v-for="opt in EFFECTS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </template>
      </PerEyeRow>
      <RangeRow
        condition="customMask"
        param="intensity"
        label="Intensity"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
      <p class="placeholder">Paint canvas + brush controls land in Phase 8.2.</p>
    </template>
  </ConditionPanel>
</template>

<style scoped>
.select {
  width: 100%;
  background: var(--bg-3);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 4px 6px;
  font-size: var(--t-sm);
}

.select:disabled {
  cursor: not-allowed;
}

.placeholder {
  margin: var(--pad-sm) 0 0;
  padding: var(--pad-sm);
  font-size: var(--t-sm);
  color: var(--fg-dim);
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  text-align: center;
}
</style>
