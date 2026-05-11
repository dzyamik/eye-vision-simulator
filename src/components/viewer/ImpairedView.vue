<script setup lang="ts">
// Mounts the single Phaser game into a Vue-owned container div. For 4.1 the
// wiring is inline; the usePhaser composable (4.2) will move the
// singleton/dispose/gameReady plumbing out of the component.

import { storeToRefs } from 'pinia';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { createGame, type GameHandle } from '@/phaser/createGame';
import { useImageStore } from '@/stores/image';

const container = ref<HTMLDivElement | null>(null);
const { current } = storeToRefs(useImageStore());
let handle: GameHandle | null = null;

onMounted(() => {
  if (container.value === null) return;
  handle = createGame(container.value);
  if (current.value !== null) {
    handle.scene.setImage(current.value.src);
  }
});

watch(current, (next) => {
  if (handle !== null && next !== null) {
    handle.scene.setImage(next.src);
  }
});

onBeforeUnmount(() => {
  handle?.destroy();
  handle = null;
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
