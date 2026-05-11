<script setup lang="ts">
import AppShell from '@/components/layout/AppShell.vue';
import ImageViewer from '@/components/viewer/ImageViewer.vue';
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
