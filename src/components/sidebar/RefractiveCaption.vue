<script setup lang="ts">
// Per-eye dioptre + acuity caption shown under the strength slider for
// the refractive panels (Myopia, Hyperopia). Reads the live strength
// values from the eye-settings store and reformats; updates instantly
// alongside slider drags.
//
// Presbyopia uses the same blur visualisation but isn't included here
// because its real-world unit is "add power" for reading glasses, not a
// far-vision dioptre + acuity pair — the conversion would mislead more
// than it'd inform.

import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { useEyeSettingsStore } from '@/stores/eyeSettings';
import { formatRefractive, type RefractiveType } from '@/utils/refractive';

const props = defineProps<{
  type: RefractiveType;
}>();

const { left, right } = storeToRefs(useEyeSettingsStore());

const leftLabel = computed(() => formatRefractive(left.value[props.type].strength, props.type));
const rightLabel = computed(() => formatRefractive(right.value[props.type].strength, props.type));
</script>

<template>
  <p class="caption">
    <span class="row">
      <span class="tag">L</span>
      <span class="value">{{ leftLabel }}</span>
    </span>
    <span class="row">
      <span class="tag">R</span>
      <span class="value">{{ rightLabel }}</span>
    </span>
    <span class="hint">Approximate; assumes uncorrected vision.</span>
  </p>
</template>

<style scoped>
.caption {
  margin: 0;
  padding: var(--pad-sm);
  background: var(--bg-3);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.row {
  display: grid;
  grid-template-columns: 16px 1fr;
  gap: var(--pad-sm);
  align-items: center;
}

.tag {
  font-size: var(--t-sm);
  font-family: var(--font-mono);
  color: var(--fg-dim);
  font-weight: 600;
  text-align: center;
}

.value {
  font-size: var(--t-sm);
  font-family: var(--font-mono);
  color: var(--fg);
}

.hint {
  font-size: var(--t-sm);
  color: var(--fg-dim);
  margin-top: 2px;
}
</style>
