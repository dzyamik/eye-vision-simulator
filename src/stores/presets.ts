// Named EyeSettings snapshots ("Mild myopia", "Wet AMD", ...). Built-in list
// is sourced from src/constants/builtInPresets.ts; user presets stay
// in-memory with manual export to JSON (no localStorage — see
// dev-docs/06-state-management.md §Persistence).
//
// Mask serialization (ImageData ↔ base64 PNG) for export/import is wired in 9.2.

import { defineStore } from 'pinia';
import { ref } from 'vue';

import { BUILT_IN_PRESETS } from '@/constants/builtInPresets';
import type { EyeSettings } from '@/types/eyeSettings';
import { deepClone } from '@/utils/clone';

import { useEyeSettingsStore } from './eyeSettings';

export interface Preset {
  id: string;
  name: string;
  left: EyeSettings;
  right: EyeSettings;
  builtIn?: boolean;
}

export const usePresetsStore = defineStore('presets', () => {
  // Use spread so the store's array is independent of the imported readonly
  // tuple — protects against accidental mutation via the store ref.
  const builtIn = ref<Preset[]>([...BUILT_IN_PRESETS]);
  const userPresets = ref<Preset[]>([]);

  function load(preset: Preset): void {
    const eye = useEyeSettingsStore();
    eye.left = deepClone(preset.left);
    eye.right = deepClone(preset.right);
  }

  function saveCurrent(name: string): Preset {
    throw new Error(`usePresetsStore.saveCurrent(${name}): implemented in roadmap step 9.2`);
  }

  function exportJson(): string {
    throw new Error('usePresetsStore.exportJson: implemented in roadmap step 9.2');
  }

  function importJson(text: string): void {
    throw new Error(
      `usePresetsStore.importJson(${text.slice(0, 40)}…): implemented in roadmap step 9.2`,
    );
  }

  return { builtIn, userPresets, load, saveCurrent, exportJson, importJson };
});
