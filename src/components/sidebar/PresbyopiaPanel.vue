<script setup lang="ts">
import ConditionPanel from './ConditionPanel.vue';
import RangeRow from './RangeRow.vue';
</script>

<template>
  <ConditionPanel
    condition="presbyopia"
    title="Presbyopia"
    info="Age-related stiffening of the lens; near focus declines. Same blur visualisation as hyperopia."
  >
    <template #default="{ disabledLeft, disabledRight }">
      <RangeRow
        condition="presbyopia"
        param="strength"
        label="Strength"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
    </template>
  </ConditionPanel>
</template>
