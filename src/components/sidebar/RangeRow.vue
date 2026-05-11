<script setup lang="ts" generic="C extends ConditionKey">
// One numeric parameter rendered as two side-by-side rows (L on top, R
// underneath). The param label sits above both rows so it's not duplicated.
// Each row is just a RangeInput bound to its eye via useEyeParam; the
// disabled state comes from ConditionPanel's slot props.
//
// Generic over the condition key C so TypeScript can constrain `param` to
// only the numeric fields of that specific condition (e.g. astigmatism's
// `magnitude` / `axis`, not its `enabled` boolean).

import { useEyeParam } from '@/composables/useEyeParam';
import { RANGES } from '@/constants/ranges';
import type { ConditionKey, EyeSettings } from '@/types/eyeSettings';

import RangeInput from './RangeInput.vue';

type NumericKey<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

const props = defineProps<{
  condition: C;
  param: NumericKey<EyeSettings[C]>;
  label: string;
  disabledLeft?: boolean;
  disabledRight?: boolean;
}>();

const left = useEyeParam(
  'left',
  props.condition,
  props.param,
) as unknown as { value: number };
const right = useEyeParam(
  'right',
  props.condition,
  props.param,
) as unknown as { value: number };

// The (RANGES, condition, param) lookup is correct at runtime — both keys
// are typed against the same EyeSettings shape — but TS can't bridge the
// generic indexed-access on RANGES to the generic NumericKey type. Cast
// through unknown for the lookup; the runtime value is RangeSpec.
const range = (
  RANGES[props.condition] as unknown as Record<string, { min: number; max: number; default: number; step?: number }>
)[props.param as string];
</script>

<template>
  <div class="range-row">
    <p class="param-label">{{ label }}</p>
    <div class="eye-row">
      <span class="eye-tag">L</span>
      <RangeInput
        v-model="left.value"
        label=""
        :min="range.min"
        :max="range.max"
        :step="range.step"
        :default-value="range.default"
        :disabled="disabledLeft"
      />
    </div>
    <div class="eye-row">
      <span class="eye-tag">R</span>
      <RangeInput
        v-model="right.value"
        label=""
        :min="range.min"
        :max="range.max"
        :step="range.step"
        :default-value="range.default"
        :disabled="disabledRight"
      />
    </div>
  </div>
</template>

<style scoped>
.range-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.param-label {
  font-size: var(--t-sm);
  color: var(--fg);
  font-weight: 500;
  margin: 0;
}

.eye-row {
  display: grid;
  grid-template-columns: 16px 1fr;
  gap: var(--pad-sm);
  align-items: center;
}

.eye-tag {
  font-size: var(--t-sm);
  font-family: var(--font-mono);
  color: var(--fg-dim);
  font-weight: 600;
  text-align: center;
}
</style>
