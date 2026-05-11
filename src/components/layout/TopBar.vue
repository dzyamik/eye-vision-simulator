<script setup lang="ts">
// TopBar: branding, sample-image dropdown (wired in 3.4), Upload (3.3), and a
// hamburger that emits "toggle-sidebar" on small screens. Visual only here;
// no store interaction yet.

defineEmits<{ 'toggle-sidebar': [] }>();
</script>

<template>
  <header class="top-bar">
    <button
      type="button"
      class="hamburger"
      aria-label="Toggle sidebar"
      @click="$emit('toggle-sidebar')"
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      >
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>

    <h1 class="brand">Eye Vision Simulator</h1>

    <div class="actions">
      <select class="sample-select" disabled aria-label="Sample images">
        <option>Sample images…</option>
      </select>

      <button type="button" class="upload" disabled>Upload</button>
    </div>
  </header>
</template>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  gap: var(--pad);
  padding: var(--pad-sm) var(--pad);
  background: var(--bg-2);
  border-bottom: 1px solid var(--border);
  min-height: 48px;
}

.brand {
  font-size: var(--t-lg);
  font-weight: 600;
  letter-spacing: 0.02em;
  margin: 0;
  color: var(--fg);
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--pad-sm);
  margin-left: auto;
}

.sample-select,
.upload {
  background: var(--bg-3);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  font-size: var(--t-sm);
}

.sample-select:disabled,
.upload:disabled {
  color: var(--fg-dim);
  cursor: not-allowed;
}

.hamburger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  color: var(--fg);
}

.hamburger:hover {
  background: var(--bg-3);
}

@media (min-width: 900px) {
  /* Sidebar is permanently visible on desktop, so the hamburger is dead weight. */
  .hamburger {
    display: none;
  }
}
</style>
