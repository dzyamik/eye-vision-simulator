<script setup lang="ts">
import AppShell from '@/components/layout/AppShell.vue';
</script>

<template>
  <AppShell>
    <template #viewer>
      <div class="placeholder placeholder--viewer">
        <p>Viewer area</p>
        <p class="hint">Original + impaired views land in step 3.2.</p>
      </div>
    </template>

    <template #sidebar>
      <div class="placeholder placeholder--sidebar">
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
  height: 100%;
  min-height: 200px;
  color: var(--fg-dim);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  padding: var(--pad-lg);
  gap: var(--pad-sm);
}

.placeholder--sidebar {
  height: auto;
  min-height: 120px;
  margin: var(--pad);
}

.hint {
  font-size: var(--t-sm);
}
</style>
