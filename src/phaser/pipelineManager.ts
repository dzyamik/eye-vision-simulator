// Single broker between Pinia state and the Phaser camera's filter stack.
// Phase 6.1 ships only the skeleton — the methods are stubs and
// syncFromStore() is a no-op. Phase 6.2+ fills each method in:
//
//   attach(camera, key)        → instantiate the Filter for `key`, insert
//                                 it into camera.filters at the position
//                                 dictated by STACKING_ORDER.
//   detach(camera, key)        → remove the Filter for `key` from
//                                 camera.filters and dispose it.
//   setUniforms(key, uniforms) → forward to the Filter instance, RAF-
//                                 coalesced upstream so we don't push GPU
//                                 work more than once per frame.
//   syncFromStore()            → walk eyeSettings + viewSettings, attach/
//                                 detach filters whose enabled flags
//                                 changed, then push current parameters.
//
// Render order matters; see dev-docs/03-eye-conditions.md §Pipeline
// stacking order for the rationale (color → cataract → blur → distortion
// → mask → field-loss → spots → sprite overlays). The constant below is
// the source of truth for the stack — don't reorder ad-hoc inside a
// pipeline class.

import type Phaser from 'phaser';

import type { ConditionKey } from '@/types/eyeSettings';

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
  attach(camera: Phaser.Cameras.Scene2D.Camera, conditionKey: ConditionKey): void;
  detach(camera: Phaser.Cameras.Scene2D.Camera, conditionKey: ConditionKey): void;
  setUniforms(conditionKey: ConditionKey, uniforms: Record<string, unknown>): void;
  syncFromStore(): void;
}

export const pipelineManager: PipelineManager = {
  attach(_camera, _conditionKey): void {
    // Phase 6.2+: insert the per-condition Filter at its STACKING_ORDER
    // index in camera.filters. For now the registry is empty; a no-op.
  },
  detach(_camera, _conditionKey): void {
    // Phase 6.2+: remove + dispose the Filter for this condition.
  },
  setUniforms(_conditionKey, _uniforms): void {
    // Phase 6.2+: forward to the registered Filter instance.
  },
  syncFromStore(): void {
    // Phase 6.2+: read useEyeSettingsStore + useViewSettingsStore, diff
    // against the currently-attached filters, attach/detach as needed,
    // then push current parameters as uniforms via setUniforms.
    //
    // No-op for 6.1 per the step's acceptance criterion.
  },
};
