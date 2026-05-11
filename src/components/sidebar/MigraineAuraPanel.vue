<script setup lang="ts">
import { useEyeParam } from '@/composables/useEyeParam';

import ConditionPanel from './ConditionPanel.vue';
import PerEyeRow from './PerEyeRow.vue';
import RangeRow from './RangeRow.vue';

const animateLeft = useEyeParam('left', 'migraineAura', 'animate');
const animateRight = useEyeParam('right', 'migraineAura', 'animate');
</script>

<template>
  <ConditionPanel
    condition="migraineAura"
    title="Migraine aura"
    info="Optional/playful. Zigzag scotoma drifting across the visual field. v1 ships a static 'here right now' version with optional outward drift."
  >
    <template #default="{ disabledLeft, disabledRight }">
      <RangeRow
        condition="migraineAura"
        param="radius"
        label="Radius"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
      <RangeRow
        condition="migraineAura"
        param="positionX"
        label="Position X (0 = left, 1 = right)"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
      <RangeRow
        condition="migraineAura"
        param="positionY"
        label="Position Y (0 = top, 1 = bottom)"
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
            <span>slow outward drift</span>
          </label>
        </template>
        <template #right="{ disabled }">
          <label class="checkbox-row">
            <input v-model="animateRight" type="checkbox" :disabled="disabled" />
            <span>slow outward drift</span>
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
