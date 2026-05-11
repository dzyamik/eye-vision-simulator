<script setup lang="ts">
// Renders the unmodified source image (top half of the viewer). Reads
// useImageStore directly — no props — so swapping images anywhere in the app
// updates the view automatically. The empty-state "Load test image" button is
// a 3.2 stand-in for real upload UX (lands in 3.3).

import { storeToRefs } from 'pinia';

import { useImageStore } from '@/stores/image';

const store = useImageStore();
const { current } = storeToRefs(store);

// Inline SVG so we don't bundle a binary asset just for one dev affordance.
const TEST_IMAGE_SRC =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">
      <rect fill="#1d212c" width="320" height="200"/>
      <circle cx="160" cy="100" r="60" fill="#7aa2ff"/>
      <text x="160" y="180" text-anchor="middle" fill="#e8eaed" font-family="sans-serif" font-size="16">test image</text>
    </svg>`,
  );

function loadTestImage(): void {
  store.setFromSample({
    src: TEST_IMAGE_SRC,
    width: 320,
    height: 200,
    filename: 'test-image.svg',
  });
}
</script>

<template>
  <div class="original-view">
    <template v-if="current">
      <img
        class="image"
        :src="current.src"
        :alt="current.filename ?? 'source image'"
      />
      <p class="caption">
        {{ current.filename ?? 'image' }}
        <span class="dim">— {{ current.width }} × {{ current.height }}</span>
      </p>
    </template>

    <div v-else class="empty">
      <p>No image yet.</p>
      <p class="hint">Drop one here or pick a sample (3.3 / 3.4).</p>
      <button type="button" class="dev-button" @click="loadTestImage">
        Load test image
      </button>
    </div>
  </div>
</template>

<style scoped>
.original-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--pad-sm);
  height: 100%;
  min-height: 0;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--pad);
  overflow: hidden;
}

.image {
  max-width: 100%;
  max-height: calc(100% - 32px);
  object-fit: contain;
}

.caption {
  font-size: var(--t-sm);
  color: var(--fg-dim);
  margin: 0;
  text-align: center;
}

.dim {
  color: var(--fg-dim);
  opacity: 0.7;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--pad-sm);
  color: var(--fg-dim);
  text-align: center;
}

.hint {
  font-size: var(--t-sm);
}

.dev-button {
  margin-top: var(--pad-sm);
  padding: 6px 12px;
  background: var(--bg-3);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: var(--t-sm);
}

.dev-button:hover {
  border-color: var(--accent);
  color: var(--accent);
}
</style>
