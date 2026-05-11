<script setup lang="ts">
// Reference implementation of one condition panel — the pattern other
// condition panels (5.3) will copy. ConditionPanel handles the shell with
// per-eye enabled toggles; RangeRow handles the per-eye sliders for one
// numeric param.

import ConditionPanel from './ConditionPanel.vue';
import RangeRow from './RangeRow.vue';
</script>

<template>
  <ConditionPanel
    condition="myopia"
    title="Myopia (nearsightedness)"
    info="Distant objects appear blurred; near vision is fine. The slider scales the simulated blur."
  >
    <template #default="{ disabledLeft, disabledRight }">
      <RangeRow
        condition="myopia"
        param="strength"
        label="Strength"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
    </template>
  </ConditionPanel>
</template>
