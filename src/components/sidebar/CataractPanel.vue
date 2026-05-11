<script setup lang="ts">
// Subtype radio (per eye) plus four sliders. Picking a subtype writes a
// preset combination of cloudiness/yellowing/brightnessLoss/glare per
// dev-docs/04-shaders-reference.md §Cataract — but the user can still
// drag the sliders afterwards to override.

import { useEyeParam } from '@/composables/useEyeParam';
import type { CataractSubtype } from '@/types/eyeSettings';

import ConditionPanel from './ConditionPanel.vue';
import PerEyeRow from './PerEyeRow.vue';
import RangeRow from './RangeRow.vue';

const subtypeLeft = useEyeParam('left', 'cataract', 'subtype');
const subtypeRight = useEyeParam('right', 'cataract', 'subtype');

const cloudinessLeft = useEyeParam('left', 'cataract', 'cloudiness');
const yellowingLeft = useEyeParam('left', 'cataract', 'yellowing');
const brightnessLossLeft = useEyeParam('left', 'cataract', 'brightnessLoss');
const glareLeft = useEyeParam('left', 'cataract', 'glare');

const cloudinessRight = useEyeParam('right', 'cataract', 'cloudiness');
const yellowingRight = useEyeParam('right', 'cataract', 'yellowing');
const brightnessLossRight = useEyeParam('right', 'cataract', 'brightnessLoss');
const glareRight = useEyeParam('right', 'cataract', 'glare');

interface SubtypePreset {
  cloudiness: number;
  yellowing: number;
  brightnessLoss: number;
  glare: number;
}

const PRESETS: Record<CataractSubtype, SubtypePreset> = {
  nuclear: { cloudiness: 0.3, yellowing: 0.7, brightnessLoss: 0.4, glare: 0.1 },
  cortical: { cloudiness: 0.6, yellowing: 0.2, brightnessLoss: 0.3, glare: 0.5 },
  subcapsular: { cloudiness: 0.3, yellowing: 0.1, brightnessLoss: 0.2, glare: 0.9 },
};

interface SubtypeOption {
  value: CataractSubtype;
  label: string;
}

const SUBTYPES: readonly SubtypeOption[] = [
  { value: 'nuclear', label: 'Nuclear (yellowing centre)' },
  { value: 'cortical', label: 'Cortical (spoke opacities)' },
  { value: 'subcapsular', label: 'Subcapsular (severe glare)' },
] as const;

function applyPreset(side: 'left' | 'right', subtype: CataractSubtype): void {
  const p = PRESETS[subtype];
  if (side === 'left') {
    subtypeLeft.value = subtype;
    cloudinessLeft.value = p.cloudiness;
    yellowingLeft.value = p.yellowing;
    brightnessLossLeft.value = p.brightnessLoss;
    glareLeft.value = p.glare;
  } else {
    subtypeRight.value = subtype;
    cloudinessRight.value = p.cloudiness;
    yellowingRight.value = p.yellowing;
    brightnessLossRight.value = p.brightnessLoss;
    glareRight.value = p.glare;
  }
}
</script>

<template>
  <ConditionPanel
    condition="cataract"
    title="Cataract"
    info="Clouding of the lens. Three subtypes with very different appearances; selecting a subtype loads typical slider values, then drag to refine."
  >
    <template #default="{ disabledLeft, disabledRight }">
      <PerEyeRow
        label="Subtype (preset)"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      >
        <template #left="{ disabled }">
          <select
            :value="subtypeLeft"
            class="select"
            :disabled="disabled"
            @change="applyPreset('left', ($event.target as HTMLSelectElement).value as CataractSubtype)"
          >
            <option v-for="opt in SUBTYPES" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </template>
        <template #right="{ disabled }">
          <select
            :value="subtypeRight"
            class="select"
            :disabled="disabled"
            @change="applyPreset('right', ($event.target as HTMLSelectElement).value as CataractSubtype)"
          >
            <option v-for="opt in SUBTYPES" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </template>
      </PerEyeRow>
      <RangeRow
        condition="cataract"
        param="cloudiness"
        label="Cloudiness"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
      <RangeRow
        condition="cataract"
        param="yellowing"
        label="Yellowing"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
      <RangeRow
        condition="cataract"
        param="brightnessLoss"
        label="Brightness loss"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
      <RangeRow
        condition="cataract"
        param="glare"
        label="Glare"
        :disabled-left="disabledLeft"
        :disabled-right="disabledRight"
      />
    </template>
  </ConditionPanel>
</template>

<style scoped>
.select {
  width: 100%;
  background: var(--bg-3);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 4px 6px;
  font-size: var(--t-sm);
}

.select:disabled {
  cursor: not-allowed;
}
</style>
