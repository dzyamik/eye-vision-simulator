<script setup lang="ts">
// Per-eye cylinder + axis caption shown under the astigmatism controls.
// Mirrors RefractiveCaption (myopia/hyperopia) but reads two parameters
// instead of one and labels the axis category (WTR / ATR / oblique).

import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { useEyeSettingsStore } from '@/stores/eyeSettings';
import { formatAstigmatism } from '@/utils/refractive';

const { left, right } = storeToRefs(useEyeSettingsStore());

const leftLabel = computed(() =>
  formatAstigmatism(left.value.astigmatism.magnitude, left.value.astigmatism.axis),
);
const rightLabel = computed(() =>
  formatAstigmatism(right.value.astigmatism.magnitude, right.value.astigmatism.axis),
);
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
    <span class="hint">Cyl × axis (TABO); approximate, minus-cyl convention.</span>
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
