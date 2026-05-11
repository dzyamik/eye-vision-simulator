<script setup lang="ts">
import ConditionPanel from './ConditionPanel.vue';
import RangeRow from './RangeRow.vue';
</script>

<template>
  <ConditionPanel
    condition="glaucoma"
    title="Glaucoma"
    info="Damages the optic nerve; classically presents as peripheral vision loss progressing inward (tunnel vision). Real glaucoma rarely shows as a perfect circular vignette — for arcuate scotomas, use the custom mask."
  >
    <template #default="{ disabledLeft, disabledRight }">
      <RangeRow
        condition="glaucoma"
        param="innerRadius"
        label="Inner radius (preserved area)"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
      <RangeRow
        condition="glaucoma"
        param="feather"
        label="Feather"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
      <RangeRow
        condition="glaucoma"
        param="severity"
        label="Severity (peripheral darkness)"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
    </template>
  </ConditionPanel>
</template>
