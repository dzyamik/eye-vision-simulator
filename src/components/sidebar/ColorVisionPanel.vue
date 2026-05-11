<script setup lang="ts">
// Type select (per eye) + severity slider. Severity in the shader
// interpolates between the identity matrix and the deficiency matrix, so
// "mild" and "anomalous" variants come naturally from the slider.

import { useEyeParam } from '@/composables/useEyeParam';
import type { ColorVisionType } from '@/types/eyeSettings';

import ConditionPanel from './ConditionPanel.vue';
import PerEyeRow from './PerEyeRow.vue';
import RangeRow from './RangeRow.vue';

const typeLeft = useEyeParam('left', 'colorVision', 'type');
const typeRight = useEyeParam('right', 'colorVision', 'type');

interface Option {
  value: ColorVisionType;
  label: string;
}

const TYPES: readonly Option[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'protanopia', label: 'Protanopia (no L cones)' },
  { value: 'deuteranopia', label: 'Deuteranopia (no M cones)' },
  { value: 'tritanopia', label: 'Tritanopia (no S cones)' },
  { value: 'protanomaly', label: 'Protanomaly (weak L)' },
  { value: 'deuteranomaly', label: 'Deuteranomaly (weak M)' },
  { value: 'tritanomaly', label: 'Tritanomaly (weak S)' },
  { value: 'achromatopsia', label: 'Achromatopsia (no colour)' },
] as const;
</script>

<template>
  <ConditionPanel
    condition="colorVision"
    title="Colour vision deficiency"
    info="Apply a 3×3 matrix in linear RGB to simulate red/green/blue cone deficiency. Severity interpolates between identity and the full deficiency."
  >
    <template #default="{ disabledLeft, disabledRight }">
      <PerEyeRow label="Type" :disabled-left="disabledLeft" :disabled-right="disabledRight">
        <template #left="{ disabled }">
          <select v-model="typeLeft" class="select" :disabled="disabled">
            <option v-for="opt in TYPES" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </template>
        <template #right="{ disabled }">
          <select v-model="typeRight" class="select" :disabled="disabled">
            <option v-for="opt in TYPES" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </template>
      </PerEyeRow>
      <RangeRow
        condition="colorVision"
        param="severity"
        label="Severity"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
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
</style>
