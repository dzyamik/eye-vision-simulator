<script setup lang="ts">
// Stacks the unmodified source image on top and the (eventual) Phaser-rendered
// impaired view beneath. Pure layout — neither child knows about the other.

import OriginalView from './OriginalView.vue';
</script>

<template>
  <div class="image-viewer">
    <section class="pane">
      <header class="pane-header">
        <h2 class="pane-title">Original</h2>
      </header>
      <div class="pane-body">
        <OriginalView />
      </div>
    </section>

    <section class="pane">
      <header class="pane-header">
        <h2 class="pane-title">Impaired</h2>
        <span class="pane-hint">(Phaser canvas — Phase 4)</span>
      </header>
      <div class="pane-body pane-body--placeholder">Impaired view goes here</div>
    </section>
  </div>
</template>

<style scoped>
.image-viewer {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: var(--pad);
  height: 100%;
  min-height: 0;
}

.pane {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: var(--pad-sm);
  min-height: 0;
}

.pane-header {
  display: flex;
  align-items: baseline;
  gap: var(--pad-sm);
}

.pane-title {
  font-size: var(--t);
  font-weight: 600;
  margin: 0;
  color: var(--fg);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.pane-hint {
  font-size: var(--t-sm);
  color: var(--fg-dim);
}

.pane-body {
  min-height: 0;
}

.pane-body--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  background: var(--bg-2);
  color: var(--fg-dim);
}
</style>
