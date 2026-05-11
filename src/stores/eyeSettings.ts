// Per-eye settings store. Single source of truth for the left and right eye's
// EyeSettings; everything downstream (sliders, Phaser pipelines, presets) reads
// from here. `linked` is a UI hint, not a constraint — the bridge composable
// `useEyeParam` is the one that propagates writes when linked is true.

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import type { EyeSettings } from '@/types/eyeSettings';
import { createDefaultEyeSettings } from '@/types/eyeSettings';

export type EyeSide = 'left' | 'right';

export const useEyeSettingsStore = defineStore('eyeSettings', () => {
  const left = ref<EyeSettings>(createDefaultEyeSettings());
  const right = ref<EyeSettings>(createDefaultEyeSettings());
  const linked = ref<boolean>(false);

  function resetEye(eye: EyeSide): void {
    (eye === 'left' ? left : right).value = createDefaultEyeSettings();
  }

  function resetAll(): void {
    left.value = createDefaultEyeSettings();
    right.value = createDefaultEyeSettings();
  }

  function copy(from: EyeSide, to: EyeSide): void {
    if (from === to) return;
    const src = (from === 'left' ? left : right).value;
    (to === 'left' ? left : right).value = structuredClone(src);
  }

  // Returns a function so callers can ask per-eye without two computeds.
  // Object.values walks every condition; each entry has an `enabled` field.
  const anyEnabled = computed(() => (eye: EyeSide) => {
    const s = eye === 'left' ? left.value : right.value;
    return Object.values(s).some((c) => (c as { enabled: boolean }).enabled);
  });

  return { left, right, linked, resetEye, resetAll, copy, anyEnabled };
});
