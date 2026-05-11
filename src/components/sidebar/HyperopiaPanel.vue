<script setup lang="ts">
import ConditionPanel from './ConditionPanel.vue';
import RangeRow from './RangeRow.vue';
import RefractiveCaption from './RefractiveCaption.vue';
</script>

<template>
  <ConditionPanel
    condition="hyperopia"
    title="Hyperopia (farsightedness)"
    info="Near objects appear blurred, distance OK. Visualised as a uniform blur, like myopia, but labelled separately for educational clarity."
  >
    <template #default="{ disabledLeft, disabledRight }">
      <RangeRow
        condition="hyperopia"
        param="strength"
        label="Strength"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
      <RefractiveCaption type="hyperopia" />
    </template>
  </ConditionPanel>
</template>
