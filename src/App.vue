<script setup lang="ts">
import { onMounted } from 'vue';

import AppShell from '@/components/layout/AppShell.vue';
import ImageViewer from '@/components/viewer/ImageViewer.vue';
import { useImageStore } from '@/stores/image';
import { useToastStore } from '@/stores/toast';

const image = useImageStore();
const toast = useToastStore();

onMounted(async () => {
  try {
    await image.loadSampleManifest();
  } catch (err) {
    toast.push(`Sample images failed to load: ${(err as Error).message}`, { type: 'error' });
  }
});
</script>

<template>
  <AppShell>
    <template #viewer>
      <ImageViewer />
    </template>

    <template #sidebar>
      <div class="placeholder">
        <p>Sidebar area</p>
        <p class="hint">Eye selector + condition panels land in Phase 5.</p>
      </div>
    </template>
  </AppShell>
</template>

<style scoped>
.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 120px;
  color: var(--fg-dim);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  padding: var(--pad-lg);
  gap: var(--pad-sm);
  margin: var(--pad);
}

.hint {
  font-size: var(--t-sm);
}
</style>
