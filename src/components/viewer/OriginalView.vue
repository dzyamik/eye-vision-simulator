<script setup lang="ts">
// Renders the unmodified source image (top half of the viewer). Reads
// useImageStore directly — no props — so swapping images anywhere in the app
// updates the view automatically.

import { storeToRefs } from 'pinia';

import { useImageStore } from '@/stores/image';

const { current } = storeToRefs(useImageStore());
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
      <p class="hint">Drag one onto the viewer or click <strong>Upload</strong>.</p>
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
</style>
