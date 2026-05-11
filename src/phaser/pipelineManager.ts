// Single broker between Pinia state and the Phaser camera's filter stack.
// Phase 6.1 shipped only the skeleton; 6.2 adds the first real wire-up:
// the blur conditions (myopia / hyperopia / presbyopia) drive a shared
// Phaser.Filters.Blur via the BlurPipeline adapter.
//
// Lifecycle:
//   - VisionScene boots → ImpairedView calls pipelineManager.init(scene).
//   - init() stores the camera ref + sets up a deep watch on the
//     eyeSettings store + runs an initial syncFromStore.
//   - Slider drag mutates the store → watch fires → syncFromStore reads
//     the latest store values + delegates to per-condition adapters
//     (currently just syncBlur).
//
// Render order matters; see dev-docs/03-eye-conditions.md §Pipeline
// stacking order for the rationale (color → cataract → blur → distortion
// → mask → field-loss → spots → sprite overlays). The constant below is
// the source of truth for the stack — don't reorder ad-hoc inside a
// pipeline class.

import type Phaser from 'phaser';
import { watch } from 'vue';

import { useEyeSettingsStore } from '@/stores/eyeSettings';
import type { ConditionKey, EyeSettings } from '@/types/eyeSettings';

import { disposeAstigmatism, syncAstigmatism } from './pipelines/AstigmatismPipeline';
import { disposeBlur, syncBlur } from './pipelines/BlurPipeline';

export const STACKING_ORDER: readonly ConditionKey[] = [
  'colorVision',
  'cataract',
  'myopia',
  'hyperopia',
  'presbyopia',
  'astigmatism',
  'amd',
  'customMask',
  'glaucoma',
  'retinitisPigmentosa',
  'diabeticRetinopathy',
  'floaters',
  'migraineAura',
] as const;

export interface PipelineManager {
  /** Bind to the scene's main camera and start watching the store. Idempotent
   *  — subsequent calls re-bind to the new scene (HMR / scene swap). */
  init(scene: Phaser.Scene): void;
  attach(camera: Phaser.Cameras.Scene2D.Camera, conditionKey: ConditionKey): void;
  detach(camera: Phaser.Cameras.Scene2D.Camera, conditionKey: ConditionKey): void;
  setUniforms(conditionKey: ConditionKey, uniforms: Record<string, unknown>): void;
  syncFromStore(): void;
}

let camera: Phaser.Cameras.Scene2D.Camera | null = null;
let stopWatch: (() => void) | null = null;

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

interface BlurSide {
  myopia: { enabled: boolean; strength: number };
  hyperopia: { enabled: boolean; strength: number };
  presbyopia: { enabled: boolean; strength: number };
}

function combinedBlur(side: BlurSide): { active: boolean; strength: number } {
  let strength = 0;
  let active = false;
  if (side.myopia.enabled) {
    strength += side.myopia.strength;
    active = true;
  }
  if (side.hyperopia.enabled) {
    strength += side.hyperopia.strength;
    active = true;
  }
  if (side.presbyopia.enabled) {
    strength += side.presbyopia.strength;
    active = true;
  }
  return { active, strength: clamp01(strength) };
}

function syncBlurFromStore(eye: ReturnType<typeof useEyeSettingsStore>): void {
  if (camera === null) return;
  const l = combinedBlur(eye.left as BlurSide);
  const r = combinedBlur(eye.right as BlurSide);
  syncBlur(camera, {
    leftActive: l.active,
    leftStrength: l.strength,
    rightActive: r.active,
    rightStrength: r.strength,
  });
}

function syncAstigmatismFromStore(eye: ReturnType<typeof useEyeSettingsStore>): void {
  if (camera === null) return;
  syncAstigmatism(camera, {
    leftActive: eye.left.astigmatism.enabled,
    leftMagnitude: eye.left.astigmatism.magnitude,
    leftAxis: eye.left.astigmatism.axis,
    rightActive: eye.right.astigmatism.enabled,
    rightMagnitude: eye.right.astigmatism.magnitude,
    rightAxis: eye.right.astigmatism.axis,
  });
}

export const pipelineManager: PipelineManager = {
  init(scene): void {
    if (camera !== null && stopWatch !== null) {
      // Re-init: tear down the old watcher + filters so we don't double-up.
      stopWatch();
      disposeBlur(camera);
      disposeAstigmatism(camera);
    }
    camera = scene.cameras.main;
    const eye = useEyeSettingsStore();
    stopWatch = watch(
      () => [eye.left, eye.right] as [EyeSettings, EyeSettings],
      () => pipelineManager.syncFromStore(),
      { deep: true, flush: 'post' },
    );
    pipelineManager.syncFromStore();
  },

  attach(_camera, _conditionKey): void {
    // Reserved for per-condition Filter wiring in 6.3+. The blur conditions
    // currently route through syncBlur because three conditions feed one
    // shared filter; conditions with their own dedicated filter (color
    // vision, cataract, glaucoma, …) will use this method.
  },

  detach(_camera, _conditionKey): void {
    // See attach — symmetric.
  },

  setUniforms(_conditionKey, _uniforms): void {
    // 6.3+: forward to the registered Filter instance.
  },

  syncFromStore(): void {
    if (camera === null) return;
    const eye = useEyeSettingsStore();
    syncBlurFromStore(eye);
    syncAstigmatismFromStore(eye);
    // 6.4+ adds more per-condition syncs here (syncColorVision,
    // syncCataract, syncGlaucoma, …).
  },
};
