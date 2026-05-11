<script setup lang="ts">
// Hosts the Phaser canvas. State is delegated to the usePhaser composable;
// this component is responsible only for owning the mount node, syncing the
// current image into Phaser, and tearing the singleton down on unmount.
//
// The split-view divider is a DOM overlay (not a Phaser game object) so it
// doesn't pass through any camera filters and reads as a clean UI marker.
//
// WebGL fallback (9.5): if the browser can't initialise WebGL, we never
// mount Phaser. The pane shows a friendly card explaining the limitation
// and the sidebar continues to work (sliders simply have no visual effect).

import { storeToRefs } from 'pinia';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { usePhaser } from '@/composables/usePhaser';
import { pipelineManager } from '@/phaser/pipelineManager';
import { useImageStore } from '@/stores/image';
import { useToastStore } from '@/stores/toast';
import { useViewSettingsStore } from '@/stores/viewSettings';

function detectWebgl(): boolean {
  try {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2') ?? probe.getContext('webgl'));
  } catch {
    return false;
  }
}

const container = ref<HTMLDivElement | null>(null);
const { current } = storeToRefs(useImageStore());
const { viewMode } = storeToRefs(useViewSettingsStore());
const toast = useToastStore();
const webglOk = ref(detectWebgl());
let phaser: ReturnType<typeof usePhaser> | null = null;

onMounted(async () => {
  if (!webglOk.value) return;
  if (container.value === null) return;
  phaser = usePhaser(container.value);
  await phaser.gameReady;
  const scene = phaser.getScene();
  if (scene !== null) {
    pipelineManager.init(scene);
    // VisionScene's loader emits 'image-load-error' when an image fetch
    // fails (broken URL, CORS, network issue). Surface it as a toast so
    // the user knows why the impaired view didn't update.
    scene.events.on('image-load-error', (info: { src: string }) => {
      const tail = info.src.length > 60 ? `…${info.src.slice(-60)}` : info.src;
      toast.push(`Couldn't load image: ${tail}`, { type: 'error' });
    });
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
    <div v-if="!webglOk" class="webgl-fallback" role="alert">
      <h3 class="title">WebGL unavailable</h3>
      <p class="body">
        The impaired view runs on GPU shaders, which need WebGL. Your browser
        couldn't initialise it.
      </p>
      <p class="body dim">
        Try enabling hardware acceleration in your browser settings, or use a
        recent build of Chrome, Firefox, Edge or Safari. Sidebar controls still
        work — they just won't render an effect here.
      </p>
    </div>
    <div v-if="viewMode === 'split' && webglOk" class="split-divider" aria-hidden="true">
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

.webgl-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--pad-sm);
  padding: var(--pad-lg);
  text-align: center;
  background: var(--bg-2);
}

.webgl-fallback .title {
  margin: 0;
  font-size: var(--t-lg);
  color: var(--warn);
}

.webgl-fallback .body {
  margin: 0;
  max-width: 420px;
  font-size: var(--t-sm);
  color: var(--fg);
  line-height: 1.5;
}

.webgl-fallback .dim {
  color: var(--fg-dim);
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
