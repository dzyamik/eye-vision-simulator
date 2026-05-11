<script setup lang="ts">
import ConditionPanel from './ConditionPanel.vue';
import RangeRow from './RangeRow.vue';
</script>

<template>
  <ConditionPanel
    condition="amd"
    title="Age-related macular degeneration"
    info="Damages the macula → central vision loss. Dry: gradual blur and fade in the centre. Wet: straight lines bend (metamorphopsia) plus a central scotoma."
  >
    <template #default="{ disabledLeft, disabledRight }">
      <RangeRow
        condition="amd"
        param="scotomaRadius"
        label="Scotoma radius (central dark spot)"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
      <RangeRow
        condition="amd"
        param="falloff"
        label="Falloff"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
      <RangeRow
        condition="amd"
        param="distortion"
        label="Distortion (metamorphopsia)"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
    </template>
  </ConditionPanel>
</template>
