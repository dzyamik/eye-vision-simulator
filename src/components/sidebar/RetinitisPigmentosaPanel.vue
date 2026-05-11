<script setup lang="ts">
import ConditionPanel from './ConditionPanel.vue';
import RangeRow from './RangeRow.vue';
</script>

<template>
  <ConditionPanel
    condition="retinitisPigmentosa"
    title="Retinitis pigmentosa"
    info="Genetic; severe peripheral loss + night blindness. Tunnel vision plus reduced overall brightness, even inside the visible region."
  >
    <template #default="{ disabledLeft, disabledRight }">
      <RangeRow
        condition="retinitisPigmentosa"
        param="tunnelRadius"
        label="Tunnel radius"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
      <RangeRow
        condition="retinitisPigmentosa"
        param="feather"
        label="Feather"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
      <RangeRow
        condition="retinitisPigmentosa"
        param="brightnessLoss"
        label="Brightness loss (inside the visible region)"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
    </template>
  </ConditionPanel>
</template>
