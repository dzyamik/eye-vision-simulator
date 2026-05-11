<script setup lang="ts">
// Layout helper for non-numeric per-eye controls (selects, radios, checkboxes).
// Mirrors RangeRow's L-on-top, R-below structure but lets the parent inject
// arbitrary controls per side via `#left` and `#right` slots, each receiving
// a `disabled` flag so the parent doesn't need to pass it twice.

defineProps<{
  label: string;
  disabledLeft?: boolean;
  disabledRight?: boolean;
}>();
</script>

<template>
  <div class="per-eye-row">
    <p class="param-label">{{ label }}</p>
    <div class="eye-row" :class="{ 'eye-row--disabled': disabledLeft }">
      <span class="eye-tag">L</span>
      <slot name="left" :disabled="disabledLeft" />
    </div>
    <div class="eye-row" :class="{ 'eye-row--disabled': disabledRight }">
      <span class="eye-tag">R</span>
      <slot name="right" :disabled="disabledRight" />
    </div>
  </div>
</template>

<style scoped>
.per-eye-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.param-label {
  font-size: var(--t-sm);
  color: var(--fg);
  font-weight: 500;
  margin: 0;
}

.eye-row {
  display: grid;
  grid-template-columns: 16px 1fr;
  gap: var(--pad-sm);
  align-items: center;
}

.eye-row--disabled {
  opacity: 0.5;
}

.eye-tag {
  font-size: var(--t-sm);
  font-family: var(--font-mono);
  color: var(--fg-dim);
  font-weight: 600;
  text-align: center;
}
</style>
