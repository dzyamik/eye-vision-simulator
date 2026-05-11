<script setup lang="ts">
// Hosts the Phaser canvas. State is delegated to the usePhaser composable;
// this component is responsible only for owning the mount node, syncing the
// current image into Phaser, and tearing the singleton down on unmount.

import { storeToRefs } from 'pinia';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { usePhaser } from '@/composables/usePhaser';
import { pipelineManager } from '@/phaser/pipelineManager';
import { useImageStore } from '@/stores/image';

const container = ref<HTMLDivElement | null>(null);
const { current } = storeToRefs(useImageStore());
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
  <div ref="container" class="impaired-view"></div>
</template>

<style scoped>
.impaired-view {
  width: 100%;
  height: 100%;
  min-height: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--bg-2);
}
</style>
