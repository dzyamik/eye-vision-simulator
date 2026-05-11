<script setup lang="ts">
// Per-eye paint surface for the Custom mask condition. Renders the current
// image faintly underneath, mounts a useMaskCanvas() canvas on top, and
// translates pointer events into paintAt calls. Pushes the canvas's
// ImageData to useEyeSettingsStore on pointer-up / clear (per
// dev-docs/06-state-management.md §Custom mask architecture).
//
// One MaskPanel for both eyes, with an internal L/R tab toggling which
// eye's canvas is mounted in the paint area. Two useMaskCanvas instances
// (one per eye) live on the component instance.

import { storeToRefs } from 'pinia';
import { computed, markRaw, onBeforeUnmount, ref, watch } from 'vue';

import { useMaskCanvas, type PaintMode } from '@/composables/useMaskCanvas';
import { useEyeSettingsStore } from '@/stores/eyeSettings';
import { useImageStore } from '@/stores/image';

import RangeInput from './RangeInput.vue';

type Side = 'left' | 'right';

const eye = useEyeSettingsStore();
const { current: currentImage } = storeToRefs(useImageStore());

const leftMask = useMaskCanvas();
const rightMask = useMaskCanvas();

const activeSide = ref<Side>('left');
const activeMask = computed(() => (activeSide.value === 'left' ? leftMask : rightMask));

const brushSize = ref(0.05);
const brushHardness = ref(0.6);
const brushMode = ref<PaintMode>('paint');

const mountPoint = ref<HTMLDivElement | null>(null);
let isPainting = false;

function pushToStore(): void {
  const data = activeMask.value.getImageData();
  if (data !== null) {
    // markRaw so Vue doesn't wrap the ImageData (and its underlying typed
    // array) in a reactive Proxy. The store's `maskData` property is
    // still reactive — the parent assignment fires the watcher — but the
    // ImageData object itself stays in its native form so consumers
    // (CustomMaskPipeline → putImageData → uploadMask) see a real
    // ImageData and not a proxy that breaks DOM API contracts.
    eye[activeSide.value].customMask.maskData = markRaw(data);
  }
}

function pointerCoords(e: PointerEvent): { x: number; y: number } {
  const canvas = activeMask.value.canvas;
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) / Math.max(1, rect.width),
    y: (e.clientY - rect.top) / Math.max(1, rect.height),
  };
}

function onPointerDown(e: PointerEvent): void {
  if (e.button !== 0) return;
  isPainting = true;
  (e.currentTarget as Element).setPointerCapture(e.pointerId);
  const { x, y } = pointerCoords(e);
  activeMask.value.paintAt(x, y, brushSize.value, brushHardness.value, brushMode.value);
}

function onPointerMove(e: PointerEvent): void {
  if (!isPainting) return;
  const { x, y } = pointerCoords(e);
  activeMask.value.paintAt(x, y, brushSize.value, brushHardness.value, brushMode.value);
}

function onPointerUp(e: PointerEvent): void {
  if (!isPainting) return;
  isPainting = false;
  try {
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);
  } catch {
    /* no capture, nothing to release */
  }
  pushToStore();
}

function clearActive(): void {
  activeMask.value.clear();
  pushToStore();
}

// Whenever the mount point appears or the active side changes, swap which
// canvas is the visible child of the mount node. Both canvases live in
// memory either way — we just show one at a time.
watch(
  [mountPoint, activeMask],
  ([mount, mask]) => {
    if (mount === null) return;
    while (mount.firstChild !== null) mount.removeChild(mount.firstChild);
    mount.appendChild(mask.canvas);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  // Canvases are JS objects; no DOM teardown needed beyond what Vue does.
});
</script>

<template>
  <div class="mask-panel">
    <div class="side-tabs" role="tablist" aria-label="Mask eye selector">
      <button
        type="button"
        role="tab"
        class="tab"
        :class="{ 'tab--active': activeSide === 'left' }"
        :aria-selected="activeSide === 'left'"
        @click="activeSide = 'left'"
      >
        L
      </button>
      <button
        type="button"
        role="tab"
        class="tab"
        :class="{ 'tab--active': activeSide === 'right' }"
        :aria-selected="activeSide === 'right'"
        @click="activeSide = 'right'"
      >
        R
      </button>
    </div>

    <div class="paint-area">
      <img v-if="currentImage" class="preview" :src="currentImage.src" alt="" />
      <div
        ref="mountPoint"
        class="canvas-host"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      ></div>
    </div>

    <p class="caption">Paint where vision should be impaired.</p>

    <RangeInput
      v-model="brushSize"
      label="Brush size"
      :min="0.005"
      :max="0.2"
      :step="0.005"
      :default-value="0.05"
    />
    <RangeInput
      v-model="brushHardness"
      label="Hardness"
      :min="0"
      :max="1"
      :step="0.01"
      :default-value="0.6"
    />

    <div class="modes" role="radiogroup" aria-label="Brush mode">
      <button
        type="button"
        role="radio"
        class="mode-btn"
        :class="{ 'mode-btn--active': brushMode === 'paint' }"
        :aria-checked="brushMode === 'paint'"
        @click="brushMode = 'paint'"
      >
        Paint
      </button>
      <button
        type="button"
        role="radio"
        class="mode-btn"
        :class="{ 'mode-btn--active': brushMode === 'erase' }"
        :aria-checked="brushMode === 'erase'"
        @click="brushMode = 'erase'"
      >
        Erase
      </button>
      <button type="button" class="mode-btn mode-btn--clear" @click="clearActive">
        Clear
      </button>
    </div>
  </div>
</template>

<style scoped>
.mask-panel {
  display: flex;
  flex-direction: column;
  gap: var(--pad-sm);
}

.side-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.tab {
  background: var(--bg-3);
  color: var(--fg-dim);
  padding: 4px 0;
  font-size: var(--t-sm);
  font-family: var(--font-mono);
  font-weight: 600;
  border: none;
  border-right: 1px solid var(--border);
  cursor: pointer;
}

.tab:last-child {
  border-right: none;
}

.tab--active {
  background: var(--accent);
  color: var(--bg);
}

.paint-area {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: var(--bg-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.preview {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0.35;
  pointer-events: none;
}

.canvas-host {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  touch-action: none;
}

:deep(.canvas-host canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

.caption {
  margin: 0;
  font-size: var(--t-sm);
  color: var(--fg-dim);
}

.modes {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 4px;
}

.mode-btn {
  background: var(--bg-3);
  color: var(--fg);
  padding: 6px 0;
  font-size: var(--t-sm);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.mode-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.mode-btn--active {
  background: var(--accent);
  color: var(--bg);
  border-color: var(--accent);
}

.mode-btn--clear {
  color: var(--warn);
  border-color: var(--border);
}

.mode-btn--clear:hover {
  border-color: var(--warn);
}
</style>
