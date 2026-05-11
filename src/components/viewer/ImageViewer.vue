<script setup lang="ts">
// Stacks the unmodified source image on top and the (eventual) Phaser-rendered
// impaired view beneath. Owns the drop-zone for the entire viewer area —
// dragging an image file anywhere over the panes routes to image.setFromFile.

import { ref } from 'vue';

import { useImageStore } from '@/stores/image';
import { useToastStore } from '@/stores/toast';

import ImpairedView from './ImpairedView.vue';
import OriginalView from './OriginalView.vue';

const image = useImageStore();
const toast = useToastStore();

// dragenter/dragleave fire on every child element, so we count them and only
// flip the visual state when the counter reaches zero. Without this the
// highlight flickers as the cursor crosses internal boundaries.
const dragCounter = ref(0);
const dragging = ref(false);

function onDragEnter(e: DragEvent): void {
  if (!hasFiles(e)) return;
  e.preventDefault();
  dragCounter.value += 1;
  dragging.value = true;
}

function onDragLeave(e: DragEvent): void {
  if (!hasFiles(e)) return;
  e.preventDefault();
  dragCounter.value = Math.max(0, dragCounter.value - 1);
  if (dragCounter.value === 0) dragging.value = false;
}

function onDragOver(e: DragEvent): void {
  // preventDefault on dragover is what lets `drop` actually fire.
  if (hasFiles(e)) e.preventDefault();
}

async function onDrop(e: DragEvent): Promise<void> {
  e.preventDefault();
  dragCounter.value = 0;
  dragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  try {
    await image.setFromFile(file);
  } catch (err) {
    toast.push((err as Error).message, { type: 'error' });
  }
}

function hasFiles(e: DragEvent): boolean {
  return Array.from(e.dataTransfer?.types ?? []).includes('Files');
}
</script>

<template>
  <div
    class="image-viewer"
    :class="{ 'image-viewer--drag': dragging }"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @dragover="onDragOver"
    @drop="onDrop"
  >
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
        <span class="pane-hint">(no effects yet — Phase 6)</span>
      </header>
      <div class="pane-body">
        <ImpairedView />
      </div>
    </section>

    <div v-if="dragging" class="drop-overlay" aria-hidden="true">Drop image to load</div>
  </div>
</template>

<style scoped>
.image-viewer {
  position: relative;
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: var(--pad);
  height: 100%;
  min-height: 0;
}

.image-viewer--drag {
  outline: 2px dashed var(--accent);
  outline-offset: -2px;
  border-radius: var(--radius);
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

.drop-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 17, 21, 0.7);
  color: var(--accent);
  font-size: var(--t-lg);
  font-weight: 600;
  pointer-events: none;
  border-radius: var(--radius);
}
</style>
