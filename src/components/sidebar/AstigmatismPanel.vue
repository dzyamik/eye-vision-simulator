<script setup lang="ts">
// Magnitude stays a normal RangeRow. Axis gets the per-eye AxisDial — the
// dial syncs with its built-in numeric input, both bound to the store via
// useEyeParam.

import type { WritableComputedRef } from 'vue';

import { useEyeParam } from '@/composables/useEyeParam';
import { RANGES } from '@/constants/ranges';

import AstigmatismCaption from './AstigmatismCaption.vue';
import AxisDial from './AxisDial.vue';
import ConditionPanel from './ConditionPanel.vue';
import PerEyeRow from './PerEyeRow.vue';
import RangeRow from './RangeRow.vue';

const axisLeft = useEyeParam('left', 'astigmatism', 'axis') as unknown as WritableComputedRef<number>;
const axisRight = useEyeParam('right', 'astigmatism', 'axis') as unknown as WritableComputedRef<number>;

const axisRange = RANGES.astigmatism.axis;
</script>

<template>
  <ConditionPanel
    condition="astigmatism"
    title="Astigmatism"
    info="Cornea shaped like a rugby ball; light focuses on multiple planes. Direction-dependent blur — vertically-oriented astigmatism blurs vertical lines more than horizontal."
  >
    <template #default="{ disabledLeft, disabledRight }">
      <RangeRow
        condition="astigmatism"
        param="magnitude"
        label="Magnitude"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
      <PerEyeRow
        label="Axis (drag the dial or type)"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      >
        <template #left="{ disabled }">
          <AxisDial v-model="axisLeft" :default-value="axisRange.default" :disabled="disabled" />
        </template>
        <template #right="{ disabled }">
          <AxisDial v-model="axisRight" :default-value="axisRange.default" :disabled="disabled" />
        </template>
      </PerEyeRow>
      <AstigmatismCaption />
    </template>
  </ConditionPanel>
</template>
