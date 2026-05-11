<script setup lang="ts">
import { onMounted } from 'vue';

import AppShell from '@/components/layout/AppShell.vue';
import AmdPanel from '@/components/sidebar/AmdPanel.vue';
import AppSidebar from '@/components/sidebar/AppSidebar.vue';
import AstigmatismPanel from '@/components/sidebar/AstigmatismPanel.vue';
import CataractPanel from '@/components/sidebar/CataractPanel.vue';
import ColorVisionPanel from '@/components/sidebar/ColorVisionPanel.vue';
import ConditionGroup from '@/components/sidebar/ConditionGroup.vue';
import CustomMaskPanel from '@/components/sidebar/CustomMaskPanel.vue';
import DiabeticRetinopathyPanel from '@/components/sidebar/DiabeticRetinopathyPanel.vue';
import EyeActions from '@/components/sidebar/EyeActions.vue';
import PresetPanel from '@/components/sidebar/PresetPanel.vue';
import FloatersPanel from '@/components/sidebar/FloatersPanel.vue';
import GlaucomaPanel from '@/components/sidebar/GlaucomaPanel.vue';
import HyperopiaPanel from '@/components/sidebar/HyperopiaPanel.vue';
import MigraineAuraPanel from '@/components/sidebar/MigraineAuraPanel.vue';
import MyopiaPanel from '@/components/sidebar/MyopiaPanel.vue';
import PresbyopiaPanel from '@/components/sidebar/PresbyopiaPanel.vue';
import RetinitisPigmentosaPanel from '@/components/sidebar/RetinitisPigmentosaPanel.vue';
import SyncToggle from '@/components/sidebar/SyncToggle.vue';
import ImageViewer from '@/components/viewer/ImageViewer.vue';
import { useUrlSync } from '@/composables/useUrlSync';
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
  // useUrlSync() registers the watcher; applyFromCurrentUrl applies any
  // ?s= blob in the address bar. Order matters — sample manifest must be
  // loaded first so a sample-by-filename lookup in the URL state can hit.
  useUrlSync().applyFromCurrentUrl();
});
</script>

<template>
  <AppShell>
    <template #viewer>
      <ImageViewer />
    </template>

    <template #sidebar>
      <AppSidebar>
        <SyncToggle />
        <EyeActions />
        <PresetPanel />

        <ConditionGroup
          title="Refractive errors"
          :conditions="['myopia', 'hyperopia', 'astigmatism', 'presbyopia']"
          default-open
        >
          <MyopiaPanel />
          <HyperopiaPanel />
          <AstigmatismPanel />
          <PresbyopiaPanel />
        </ConditionGroup>

        <ConditionGroup title="Colour vision" :conditions="['colorVision']">
          <ColorVisionPanel />
        </ConditionGroup>

        <ConditionGroup title="Cataract" :conditions="['cataract']">
          <CataractPanel />
        </ConditionGroup>

        <ConditionGroup
          title="Field loss"
          :conditions="['glaucoma', 'amd', 'diabeticRetinopathy', 'retinitisPigmentosa']"
        >
          <GlaucomaPanel />
          <AmdPanel />
          <DiabeticRetinopathyPanel />
          <RetinitisPigmentosaPanel />
        </ConditionGroup>

        <ConditionGroup title="Overlays" :conditions="['floaters', 'migraineAura']">
          <FloatersPanel />
          <MigraineAuraPanel />
        </ConditionGroup>

        <ConditionGroup title="Custom mask" :conditions="['customMask']">
          <CustomMaskPanel />
        </ConditionGroup>
      </AppSidebar>
    </template>
  </AppShell>
</template>
