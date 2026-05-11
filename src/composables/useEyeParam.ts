// Bridges a single store path (eyeSettings[side][condition][key]) to a
// writable computed that components can v-model. The side is explicit per
// call — sliders for the left eye and the right eye each call useEyeParam
// with their own side, so both rows are always visible (per the per-eye
// sidebar UX). Linked-mode propagation stays in the setter: when
// useEyeSettingsStore.linked is true, a write to one side also mirrors to
// the other.

import { computed, type WritableComputedRef } from 'vue';

import type { EyeSide } from '@/stores/eyeSettings';
import { useEyeSettingsStore } from '@/stores/eyeSettings';
import type { ConditionKey, EyeSettings } from '@/types/eyeSettings';

export function useEyeParam<C extends ConditionKey, K extends keyof EyeSettings[C]>(
  side: EyeSide,
  condition: C,
  key: K,
): WritableComputedRef<EyeSettings[C][K]> {
  const eye = useEyeSettingsStore();

  return computed<EyeSettings[C][K]>({
    get: () => eye[side][condition][key],
    set: (value) => {
      eye[side][condition][key] = value;
      if (eye.linked) {
        const other: EyeSide = side === 'left' ? 'right' : 'left';
        eye[other][condition][key] = value;
      }
    },
  });
}
