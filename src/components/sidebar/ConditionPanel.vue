<script setup lang="ts">
// Shell for one condition. Header carries the title, an optional info hint,
// and per-eye enabled checkboxes (L and R) — each eye has its own enabled
// flag in EyeSettings, so the panel surfaces both. The body slot receives
// disabledLeft / disabledRight booleans so child RangeRow / select / dial
// components can grey the appropriate side without rebuilding the binding.
//
// Linked-mode propagation flows through useEyeParam — toggling L's enabled
// while sync is on flips R's enabled too.

import type { WritableComputedRef } from 'vue';

import { useEyeParam } from '@/composables/useEyeParam';
import type { ConditionKey } from '@/types/eyeSettings';

const props = defineProps<{
  condition: ConditionKey;
  title: string;
  info?: string;
}>();

// 'enabled' exists on every EyeSettings[C], but TS can't narrow that across
// the union via one useEyeParam call. The cast is contained here.
const enabledLeft = useEyeParam(
  'left',
  props.condition,
  'enabled' as never,
) as unknown as WritableComputedRef<boolean>;
const enabledRight = useEyeParam(
  'right',
  props.condition,
  'enabled' as never,
) as unknown as WritableComputedRef<boolean>;
</script>

<template>
  <section class="condition-panel">
    <header class="header">
      <h3 class="title">{{ title }}</h3>
      <button
        v-if="info"
        type="button"
        class="info-btn"
        :aria-label="`${title}: ${info}`"
        :title="info"
      >
        ?
      </button>
      <div class="enables">
        <label class="enable">
          <span class="eye-label">L</span>
          <input v-model="enabledLeft" type="checkbox" class="enable-input" />
        </label>
        <label class="enable">
          <span class="eye-label">R</span>
          <input v-model="enabledRight" type="checkbox" class="enable-input" />
        </label>
      </div>
    </header>
    <div class="body">
      <slot :disabled-left="!enabledLeft" :disabled-right="!enabledRight" />
    </div>
  </section>
</template>

<style scoped>
.condition-panel {
  display: flex;
  flex-direction: column;
  gap: var(--pad-sm);
  padding: var(--pad);
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.header {
  display: flex;
  align-items: center;
  gap: var(--pad-sm);
  flex-wrap: wrap;
}

.title {
  font-size: var(--t);
  font-weight: 600;
  color: var(--fg);
  margin: 0;
  flex: 1;
}

.info-btn {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--fg-dim);
  border: 1px solid var(--border);
  border-radius: 50%;
  font-size: var(--t-sm);
  line-height: 1;
}

.info-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.enables {
  display: flex;
  gap: var(--pad-sm);
}

.enable {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.eye-label {
  font-size: var(--t-sm);
  font-family: var(--font-mono);
  color: var(--fg-dim);
  font-weight: 600;
}

.enable-input {
  accent-color: var(--accent);
  width: 14px;
  height: 14px;
  cursor: pointer;
}

.body {
  display: flex;
  flex-direction: column;
  gap: var(--pad-sm);
}
</style>
