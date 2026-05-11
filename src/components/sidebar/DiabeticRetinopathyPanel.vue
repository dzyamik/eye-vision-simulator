<script setup lang="ts">
import ConditionPanel from './ConditionPanel.vue';
import RangeRow from './RangeRow.vue';
</script>

<template>
  <ConditionPanel
    condition="diabeticRetinopathy"
    title="Diabetic retinopathy"
    info="Damages retinal blood vessels; creates patchy dark spots in the visual field plus general haziness."
  >
    <template #default="{ disabledLeft, disabledRight }">
      <RangeRow
        condition="diabeticRetinopathy"
        param="spotCount"
        label="Spot count"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
      <RangeRow
        condition="diabeticRetinopathy"
        param="spotSize"
        label="Spot size"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
      <RangeRow
        condition="diabeticRetinopathy"
        param="severity"
        label="Severity (spot opacity)"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
    </template>
  </ConditionPanel>
</template>
