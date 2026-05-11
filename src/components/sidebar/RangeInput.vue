<script setup lang="ts">
// Generic slider used by every numeric parameter in the sidebar. Layout is
// a header row (label + numeric input + reset button) above a full-width
// range slider. Both inputs emit the same `update:modelValue` event so
// either editing path keeps the bound store value in sync.

const props = defineProps<{
  modelValue: number;
  label: string;
  min: number;
  max: number;
  step?: number;
  /** Used by the reset button. Named `defaultValue` (not `default`)
   *  because `default` is a reserved word in template expressions. */
  defaultValue?: number;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();

function update(e: Event): void {
  const v = Number((e.target as HTMLInputElement).value);
  if (Number.isFinite(v)) emit('update:modelValue', v);
}

function reset(): void {
  if (props.defaultValue !== undefined) emit('update:modelValue', props.defaultValue);
}
</script>

<template>
  <div class="range-input" :class="{ 'range-input--disabled': disabled }">
    <div class="header">
      <label class="label">{{ label }}</label>
      <input
        class="number"
        type="number"
        :value="modelValue"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        @input="update"
      />
      <button
        v-if="defaultValue !== undefined"
        type="button"
        class="reset"
        :disabled="disabled || modelValue === defaultValue"
        :aria-label="`Reset ${label} to default`"
        title="Reset to default"
        @click="reset"
      >
        ↺
      </button>
    </div>
    <input
      class="range"
      type="range"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      @input="update"
    />
  </div>
</template>

<style scoped>
.range-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.range-input--disabled {
  opacity: 0.5;
}

.header {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: var(--pad-sm);
  align-items: center;
}

.label {
  font-size: var(--t-sm);
  color: var(--fg-dim);
}

.number {
  width: 64px;
  background: var(--bg-3);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 2px 6px;
  font-size: var(--t-sm);
  font-family: var(--font-mono);
  text-align: right;
}

.number:disabled {
  cursor: not-allowed;
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

.range {
  width: 100%;
  accent-color: var(--accent);
}

.range:disabled {
  cursor: not-allowed;
}
</style>
