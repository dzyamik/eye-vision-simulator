<script setup lang="ts">
// Circular control for the astigmatism axis (0–180°). Astigmatism has 180°
// symmetry by definition (the axis is the orientation of a cylinder lens),
// so 0° and 180° both display as a horizontal line — drag on either half
// of the circle and the line just snaps to the equivalent angle in [0, 180).
//
// The component pairs the dial with a numeric input + reset button so users
// can either drag for feel or type for precision. Both inputs emit
// `update:modelValue` so the bound store value stays in sync from either
// editing path.

import { computed, ref } from 'vue';

const props = defineProps<{
  modelValue: number;
  defaultValue?: number;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();

const dialRef = ref<HTMLDivElement | null>(null);
const dragging = ref(false);

function angleFromPointer(e: PointerEvent): number {
  const el = dialRef.value;
  if (el === null) return props.modelValue;
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = e.clientX - cx;
  // Negate dy because screen Y grows downward; we want math convention.
  const dy = -(e.clientY - cy);
  // atan2 → angle counterclockwise from +x in radians, [-PI, PI].
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  // Astigmatism axis wraps at 180.
  return Math.round(deg) % 180;
}

function onPointerDown(e: PointerEvent): void {
  if (props.disabled) return;
  dragging.value = true;
  (e.currentTarget as Element).setPointerCapture(e.pointerId);
  emit('update:modelValue', angleFromPointer(e));
}

function onPointerMove(e: PointerEvent): void {
  if (!dragging.value) return;
  emit('update:modelValue', angleFromPointer(e));
}

function onPointerUp(e: PointerEvent): void {
  if (!dragging.value) return;
  dragging.value = false;
  (e.currentTarget as Element).releasePointerCapture(e.pointerId);
}

function onNumberInput(e: Event): void {
  const v = Number((e.target as HTMLInputElement).value);
  if (!Number.isFinite(v)) return;
  // Clamp + wrap to [0, 180); allow typing 180 explicitly (we coerce to 0).
  let n = Math.round(v);
  while (n < 0) n += 180;
  n %= 180;
  emit('update:modelValue', n);
}

function reset(): void {
  if (props.defaultValue !== undefined) emit('update:modelValue', props.defaultValue);
}

// CSS rotate is clockwise in screen coords; negative to rotate the line
// counterclockwise (math convention) so axis=90 shows a vertical line.
const lineTransform = computed(() => `rotate(${-props.modelValue}deg)`);
</script>

<template>
  <div class="axis-dial" :class="{ 'axis-dial--disabled': disabled }">
    <div
      ref="dialRef"
      class="dial"
      role="slider"
      :aria-valuemin="0"
      :aria-valuemax="179"
      :aria-valuenow="modelValue"
      aria-label="Astigmatism axis"
      :tabindex="disabled ? -1 : 0"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <svg viewBox="-50 -50 100 100" class="svg">
        <circle cx="0" cy="0" r="40" fill="none" stroke="currentColor" stroke-width="2" opacity="0.4" />
        <g :style="{ transform: lineTransform }" class="axis-line-group">
          <line x1="-38" y1="0" x2="38" y2="0" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </g>
      </svg>
    </div>
    <input
      class="number"
      type="number"
      :value="modelValue"
      min="0"
      max="180"
      step="1"
      :disabled="disabled"
      @input="onNumberInput"
    />
    <span class="unit">°</span>
    <button
      v-if="defaultValue !== undefined"
      type="button"
      class="reset"
      :disabled="disabled || modelValue === defaultValue"
      aria-label="Reset axis to default"
      title="Reset to default"
      @click="reset"
    >
      ↺
    </button>
  </div>
</template>

<style scoped>
.axis-dial {
  display: grid;
  grid-template-columns: 64px auto auto auto;
  gap: var(--pad-sm);
  align-items: center;
}

.axis-dial--disabled {
  opacity: 0.5;
}

.dial {
  width: 64px;
  height: 64px;
  color: var(--accent);
  cursor: grab;
  touch-action: none;
  border-radius: 50%;
}

.dial:active {
  cursor: grabbing;
}

.axis-dial--disabled .dial {
  cursor: not-allowed;
}

.svg {
  width: 100%;
  height: 100%;
  display: block;
}

.axis-line-group {
  transform-box: fill-box;
  transform-origin: center;
}

.number {
  width: 56px;
  background: var(--bg-3);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 2px 6px;
  font-size: var(--t-sm);
  font-family: var(--font-mono);
  text-align: right;
}

.unit {
  font-size: var(--t-sm);
  color: var(--fg-dim);
}

.reset {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--fg-dim);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  line-height: 1;
}

.reset:hover:not(:disabled) {
  color: var(--accent);
  border-color: var(--accent);
}

.reset:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
