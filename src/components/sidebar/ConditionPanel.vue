<script setup lang="ts">
// Generic shell for one condition in the sidebar: the on/off toggle, the
// title, an optional info hint, and a slot for parameter sliders. The slot
// receives `disabled` so children can grey themselves out without having to
// wire their own enabled binding.
//
// The `info` prop becomes a tooltip for now (native title attribute);
// roadmap step 9.3 swaps it for a real popover.

import type { WritableComputedRef } from 'vue';

import { useEyeParam } from '@/composables/useEyeParam';
import type { ConditionKey } from '@/types/eyeSettings';

const props = defineProps<{
  condition: ConditionKey;
  title: string;
  info?: string;
}>();

// Every condition has an `enabled: boolean`, but TS can't narrow that across
// the union of EyeSettings[ConditionKey] in a single useEyeParam call — the
// runtime cast is contained here so callers don't see it.
const enabled = useEyeParam(
  props.condition,
  'enabled' as never,
) as unknown as WritableComputedRef<boolean>;
</script>

<template>
  <section class="condition-panel">
    <header class="header">
      <label class="toggle">
        <input v-model="enabled" type="checkbox" class="toggle-input" />
        <span class="title">{{ title }}</span>
      </label>
      <button
        v-if="info"
        type="button"
        class="info-btn"
        :aria-label="`${title}: ${info}`"
        :title="info"
      >
        ?
      </button>
    </header>
    <div class="body">
      <slot :disabled="!enabled" />
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
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--pad-sm);
  cursor: pointer;
  flex: 1;
}

.toggle-input {
  accent-color: var(--accent);
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.title {
  font-size: var(--t);
  font-weight: 600;
  color: var(--fg);
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

.body {
  display: flex;
  flex-direction: column;
  gap: var(--pad-sm);
}
</style>
