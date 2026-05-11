// What the sidebar is editing (`activeEye`) and what the impaired view shows
// (`viewMode`) are independent — a user might tweak left-eye settings while
// looking at both eyes blended. See dev-docs/05-ui-ux-design.md §Eye selector.

import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ActiveEye = 'left' | 'right' | 'both';
export type ViewMode = 'both' | 'left' | 'right' | 'split';

export const useViewSettingsStore = defineStore('viewSettings', () => {
  const activeEye = ref<ActiveEye>('both');
  const viewMode = ref<ViewMode>('both');

  return { activeEye, viewMode };
});
