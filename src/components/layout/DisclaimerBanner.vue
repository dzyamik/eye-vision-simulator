<script setup lang="ts">
// One-time disclaimer banner. Appears at the top of the layout on first
// run, dismisses via the × button, and persists the dismissed state in
// localStorage so the banner doesn't return on subsequent visits.
//
// Spec is firm that this app makes NO medical claims. The text below is
// the same message used in README.md §Educational disclaimer, slightly
// tightened to fit a banner.

import { onMounted, ref } from 'vue';

const STORAGE_KEY = 'eye-vision-disclaimer-dismissed';
const visible = ref(false);

onMounted(() => {
  // localStorage may be unavailable in private browsing or with strict
  // cookie policies — default to showing the banner in that case.
  try {
    if (window.localStorage.getItem(STORAGE_KEY) !== 'true') visible.value = true;
  } catch {
    visible.value = true;
  }
});

function dismiss(): void {
  visible.value = false;
  try {
    window.localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // No-op — if storage isn't available the banner will reappear next
    // load, which is the safer failure mode.
  }
}
</script>

<template>
  <div v-if="visible" class="disclaimer" role="alert">
    <p class="text">
      <strong>Educational simulator.</strong>
      The visuals approximate eye conditions for learning and empathy-building —
      not medical diagnosis. See an eye care professional for personal advice.
    </p>
    <button
      type="button"
      class="dismiss"
      aria-label="Dismiss disclaimer"
      @click="dismiss"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.disclaimer {
  display: flex;
  align-items: flex-start;
  gap: var(--pad-sm);
  padding: var(--pad-sm) var(--pad);
  background: var(--bg-2);
  border-bottom: 1px solid var(--border);
  border-left: 3px solid var(--warn);
}

.text {
  flex: 1;
  margin: 0;
  font-size: var(--t-sm);
  color: var(--fg);
  line-height: 1.5;
}

.dismiss {
  color: var(--fg-dim);
  font-size: var(--t-lg);
  line-height: 1;
  padding: 0 4px;
  background: none;
  border: none;
  cursor: pointer;
}

.dismiss:hover {
  color: var(--fg);
}
</style>
