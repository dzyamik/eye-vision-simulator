<script setup lang="ts">
// Axis is rendered as a plain numeric slider here; the circular dial UI
// lands in 5.5 (it'll bind to the same store values).

import ConditionPanel from './ConditionPanel.vue';
import RangeRow from './RangeRow.vue';
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
      <RangeRow
        condition="astigmatism"
        param="axis"
        label="Axis (degrees, 0–180)"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
    </template>
  </ConditionPanel>
</template>
