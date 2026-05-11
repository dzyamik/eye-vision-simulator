// Bridges a single store path (eyeSettings[active][condition][key]) to a
// writable computed that components can v-model. Centralises the linked-mode
// propagation: when useEyeSettingsStore.linked is true, writes hit both
// eyes; otherwise they hit only the active side.
//
// "Active side" is left for activeEye === 'left' OR 'both', right for
// activeEye === 'right'. The 'both' case reads from left as a canonical
// source — when linked is on, both sides should already be in sync; when
// linked is off and the user selected 'both' (which auto-flips linked back
// on per EyeSelector), the next write re-syncs them anyway.

import { computed, type WritableComputedRef } from 'vue';

import type { EyeSide } from '@/stores/eyeSettings';
import { useEyeSettingsStore } from '@/stores/eyeSettings';
import { useViewSettingsStore } from '@/stores/viewSettings';
import type { ConditionKey, EyeSettings } from '@/types/eyeSettings';

export function useEyeParam<C extends ConditionKey, K extends keyof EyeSettings[C]>(
  condition: C,
  key: K,
): WritableComputedRef<EyeSettings[C][K]> {
  const eye = useEyeSettingsStore();
  const view = useViewSettingsStore();

  const activeSide = computed<EyeSide>(() => (view.activeEye === 'right' ? 'right' : 'left'));

  return computed<EyeSettings[C][K]>({
    get: () => eye[activeSide.value][condition][key],
    set: (value) => {
      if (eye.linked) {
        eye.left[condition][key] = value;
        eye.right[condition][key] = value;
      } else {
        eye[activeSide.value][condition][key] = value;
      }
    },
  });
}
