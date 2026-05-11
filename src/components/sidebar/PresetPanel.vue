<script setup lang="ts">
// Built-in presets list. Clicking a button replaces both eyes' settings via
// usePresetsStore.load(preset). User-saved presets + JSON export/import land
// in step 9.2.

import { storeToRefs } from 'pinia';

import { usePresetsStore } from '@/stores/presets';

const presets = usePresetsStore();
const { builtIn } = storeToRefs(presets);
</script>

<template>
  <section class="preset-panel">
    <header class="header">
      <h3 class="title">Presets</h3>
      <span class="hint">Replaces both eyes' settings.</span>
    </header>
    <div class="list">
      <button
        v-for="p in builtIn"
        :key="p.id"
        type="button"
        class="preset-btn"
        @click="presets.load(p)"
      >
        {{ p.name }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.preset-panel {
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
  align-items: baseline;
  gap: var(--pad-sm);
  flex-wrap: wrap;
}

.title {
  font-size: var(--t);
  font-weight: 600;
  color: var(--fg);
  margin: 0;
}

.hint {
  font-size: var(--t-sm);
  color: var(--fg-dim);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preset-btn {
  background: var(--bg-3);
  color: var(--fg);
  padding: 6px 10px;
  font-size: var(--t-sm);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  text-align: left;
  cursor: pointer;
}

.preset-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}
</style>
