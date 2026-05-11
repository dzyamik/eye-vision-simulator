<script setup lang="ts">
// Hosts the Phaser canvas. State is delegated to the usePhaser composable;
// this component is responsible only for owning the mount node, syncing the
// current image into Phaser, and tearing the singleton down on unmount.
//
// The split-view divider is a DOM overlay (not a Phaser game object) so it
// doesn't pass through any camera filters and reads as a clean UI marker.

import { storeToRefs } from 'pinia';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { usePhaser } from '@/composables/usePhaser';
import { pipelineManager } from '@/phaser/pipelineManager';
import { useImageStore } from '@/stores/image';
import { useViewSettingsStore } from '@/stores/viewSettings';

const container = ref<HTMLDivElement | null>(null);
const { current } = storeToRefs(useImageStore());
const { viewMode } = storeToRefs(useViewSettingsStore());
let phaser: ReturnType<typeof usePhaser> | null = null;

onMounted(async () => {
  if (container.value === null) return;
  phaser = usePhaser(container.value);
  await phaser.gameReady;
  const scene = phaser.getScene();
  if (scene !== null) {
    pipelineManager.init(scene);
  }
  if (current.value !== null) {
    phaser.setImage(current.value.src);
  }
});

watch(current, (next) => {
  if (phaser !== null && next !== null) {
    phaser.setImage(next.src);
  }
});

onBeforeUnmount(() => {
  phaser?.dispose();
  phaser = null;
});
</script>

<template>
  <div ref="container" class="impaired-view">
    <div v-if="viewMode === 'split'" class="split-divider" aria-hidden="true">
      <span class="label label--left">L</span>
      <span class="label label--right">R</span>
    </div>
  </div>
</template>

<style scoped>
.impaired-view {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--bg-2);
}

.split-divider {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  margin-left: -1px;
  background: var(--accent);
  pointer-events: none;
  z-index: 2;
}

.label {
  position: absolute;
  top: 8px;
  padding: 2px 6px;
  font-family: var(--font-mono);
  font-size: var(--t-sm);
  font-weight: 600;
  color: var(--bg);
  background: var(--accent);
  border-radius: var(--radius-sm);
}

.label--left {
  right: 8px;
}

.label--right {
  left: 8px;
}
</style>
