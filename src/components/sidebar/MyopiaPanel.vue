<script setup lang="ts">
// Reference implementation of one condition panel — the pattern other
// condition panels (5.3) will copy. The whole component is just composition:
// ConditionPanel handles the shell + the enabled toggle, RangeInput handles
// the strength slider, and useEyeParam binds each value to the active eye(s)
// in Pinia.

import { useEyeParam } from '@/composables/useEyeParam';
import { RANGES } from '@/constants/ranges';

import ConditionPanel from './ConditionPanel.vue';
import RangeInput from './RangeInput.vue';

const strength = useEyeParam('myopia', 'strength');
const r = RANGES.myopia.strength;
</script>

<template>
  <ConditionPanel
    condition="myopia"
    title="Myopia (nearsightedness)"
    info="Distant objects appear blurred; near vision is fine. The slider scales the simulated blur."
  >
    <template #default="{ disabled }">
      <RangeInput
        v-model="strength"
        label="Strength"
        :min="r.min"
        :max="r.max"
        :step="r.step"
        :default-value="r.default"
        :disabled="disabled"
      />
    </template>
  </ConditionPanel>
</template>
