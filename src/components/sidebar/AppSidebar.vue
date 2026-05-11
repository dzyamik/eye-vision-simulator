<script setup lang="ts">
// Slot-only scrollable container for the sidebar's stack of panels.
// Composition is owned by App.vue / a future PresetPanel — Sidebar.vue
// stays a layout wrapper so it doesn't need to know which panels exist.
</script>

<template>
  <div class="sidebar-content">
    <slot />
  </div>
</template>

<style scoped>
.sidebar-content {
  display: flex;
  flex-direction: column;
  gap: var(--pad);
  padding: var(--pad);
  overflow-y: auto;
  height: 100%;
}
</style>
