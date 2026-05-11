<script setup lang="ts">
import { onMounted } from 'vue';

import AppShell from '@/components/layout/AppShell.vue';
import AppSidebar from '@/components/sidebar/AppSidebar.vue';
import EyeSelector from '@/components/sidebar/EyeSelector.vue';
import MyopiaPanel from '@/components/sidebar/MyopiaPanel.vue';
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
      <AppSidebar>
        <EyeSelector />
        <MyopiaPanel />
      </AppSidebar>
    </template>
  </AppShell>
</template>
