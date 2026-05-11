<script setup lang="ts">
// Lets the user pick which eye(s) the impaired view renders. For 4.4 this is
// stub: it writes to useViewSettingsStore.viewMode but pipelineManager
// doesn't read it yet. Phase 7 turns it into actual rendering behaviour.

import { storeToRefs } from 'pinia';

import { useViewSettingsStore } from '@/stores/viewSettings';

const { viewMode } = storeToRefs(useViewSettingsStore());
</script>

<template>
  <select v-model="viewMode" class="view-mode" aria-label="View mode">
    <option value="both">Both eyes (blended)</option>
    <option value="left">Left eye</option>
    <option value="right">Right eye</option>
    <option value="split">Side-by-side</option>
  </select>
</template>

<style scoped>
.view-mode {
  background: var(--bg-3);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 4px 8px;
  font-size: var(--t-sm);
}

.view-mode:hover {
  border-color: var(--accent);
}
</style>
