<script setup lang="ts">
// Two-column layout shell. Sidebar is a static column at ≥900px and a
// transform-driven drawer below that. The open/close state is UI-local
// (Pinia stays out of pure layout concerns per dev-docs/06-state-management.md).

import { ref } from 'vue';

import DisclaimerBanner from './DisclaimerBanner.vue';
import ToastStack from './ToastStack.vue';
import TopBar from './TopBar.vue';

const sidebarOpen = ref(false);

function toggleSidebar(): void {
  sidebarOpen.value = !sidebarOpen.value;
}

function closeSidebar(): void {
  sidebarOpen.value = false;
}
</script>

<template>
  <div class="app-shell">
    <TopBar @toggle-sidebar="toggleSidebar" />
    <DisclaimerBanner />

    <div class="main">
      <main class="viewer">
        <slot name="viewer" />
      </main>

      <aside class="sidebar" :class="{ open: sidebarOpen }" aria-label="Settings sidebar">
        <slot name="sidebar" />
      </aside>

      <div
        v-if="sidebarOpen"
        class="backdrop"
        aria-hidden="true"
        @click="closeSidebar"
      />
    </div>

    <ToastStack />
  </div>
</template>

<style scoped>
.app-shell {
  display: grid;
  grid-template-rows: auto auto 1fr;
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.main {
  display: grid;
  grid-template-columns: 1fr;
  position: relative;
  min-height: 0;
  overflow: hidden;
}

.viewer {
  overflow: auto;
  padding: var(--pad);
  background: var(--bg);
}

.sidebar {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 320px;
  max-width: 90vw;
  background: var(--bg-2);
  border-left: 1px solid var(--border);
  overflow-y: auto;
  transform: translateX(100%);
  transition: transform 200ms ease;
  z-index: 10;
}

.sidebar.open {
  transform: translateX(0);
}

.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 5;
}

@media (min-width: 900px) {
  .main {
    grid-template-columns: 1fr 320px;
  }
  .sidebar {
    position: static;
    transform: none;
    transition: none;
    width: auto;
    max-width: none;
  }
  .backdrop {
    display: none;
  }
}
</style>
