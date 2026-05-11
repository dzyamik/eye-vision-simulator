<script setup lang="ts">
// Collapsible category container for a stack of related condition panels.
// Header shows the group title plus a "(N)" badge when at least one of the
// listed conditions is enabled on either eye. Per dev-docs/05-ui-ux-design.md,
// "Refractive errors" is open by default; the rest start collapsed.

import { computed, ref } from 'vue';

import { useEyeSettingsStore } from '@/stores/eyeSettings';
import type { ConditionKey } from '@/types/eyeSettings';

const props = defineProps<{
  title: string;
  conditions: readonly ConditionKey[];
  defaultOpen?: boolean;
}>();

const open = ref(props.defaultOpen ?? false);

const eye = useEyeSettingsStore();
const activeCount = computed(() => {
  let n = 0;
  for (const c of props.conditions) {
    if (eye.left[c].enabled || eye.right[c].enabled) n += 1;
  }
  return n;
});
</script>

<template>
  <section class="group" :class="{ 'group--open': open }">
    <button
      type="button"
      class="header"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="chevron" aria-hidden="true">{{ open ? '▾' : '▸' }}</span>
      <span class="title">{{ title }}</span>
      <span v-if="activeCount > 0" class="count">({{ activeCount }})</span>
    </button>
    <div v-if="open" class="body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.group {
  display: flex;
  flex-direction: column;
  gap: var(--pad-sm);
}

.header {
  display: flex;
  align-items: center;
  gap: var(--pad-sm);
  padding: var(--pad-sm) var(--pad);
  background: transparent;
  border: none;
  text-align: left;
  width: 100%;
  cursor: pointer;
  color: var(--fg);
  font-size: var(--t);
  font-weight: 600;
  border-radius: var(--radius-sm);
}

.header:hover {
  background: var(--bg-2);
}

.chevron {
  width: 12px;
  font-size: var(--t-sm);
  color: var(--fg-dim);
}

.title {
  flex: 1;
}

.count {
  color: var(--accent);
  font-size: var(--t-sm);
  font-weight: 500;
}

.body {
  display: flex;
  flex-direction: column;
  gap: var(--pad-sm);
}
</style>
