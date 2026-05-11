<script setup lang="ts">
// Three numeric sliders + a per-eye animate checkbox. Phase 6.9 implements
// floaters as Phaser sprites (not a shader); the animate flag is read there
// and respects prefers-reduced-motion globally too.

import { useEyeParam } from '@/composables/useEyeParam';

import ConditionPanel from './ConditionPanel.vue';
import PerEyeRow from './PerEyeRow.vue';
import RangeRow from './RangeRow.vue';

const animateLeft = useEyeParam('left', 'floaters', 'animate');
const animateRight = useEyeParam('right', 'floaters', 'animate');
</script>

<template>
  <ConditionPanel
    condition="floaters"
    title="Floaters"
    info="Specks/strands inside the vitreous; cast moving shadows. Rendered as Phaser sprites rather than a shader."
  >
    <template #default="{ disabledLeft, disabledRight }">
      <RangeRow
        condition="floaters"
        param="count"
        label="Count"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
      <RangeRow
        condition="floaters"
        param="size"
        label="Average size"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
      <RangeRow
        condition="floaters"
        param="opacity"
        label="Opacity"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
      <PerEyeRow
        label="Animate"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      >
        <template #left="{ disabled }">
          <label class="checkbox-row">
            <input v-model="animateLeft" type="checkbox" :disabled="disabled" />
            <span>drift slowly</span>
          </label>
        </template>
        <template #right="{ disabled }">
          <label class="checkbox-row">
            <input v-model="animateRight" type="checkbox" :disabled="disabled" />
            <span>drift slowly</span>
          </label>
        </template>
      </PerEyeRow>
    </template>
  </ConditionPanel>
</template>

<style scoped>
.checkbox-row {
  display: inline-flex;
  align-items: center;
  gap: var(--pad-sm);
  font-size: var(--t-sm);
  color: var(--fg-dim);
  cursor: pointer;
}

.checkbox-row input {
  accent-color: var(--accent);
}
</style>
