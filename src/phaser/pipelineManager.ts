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
import type { ViewMode } from '@/stores/viewSettings';
import { useViewSettingsStore } from '@/stores/viewSettings';
import type { ConditionKey, EyeSettings } from '@/types/eyeSettings';

import type { VisionScene } from './VisionScene';

import { disposeAmd, syncAmd } from './pipelines/AmdPipeline';
import { disposeAstigmatism, syncAstigmatism } from './pipelines/AstigmatismPipeline';
import { disposeBlur, syncBlur } from './pipelines/BlurPipeline';
import { disposeCataract, syncCataract } from './pipelines/CataractPipeline';
import { disposeColorVision, syncColorVision } from './pipelines/ColorVisionPipeline';
import {
  disposeDiabeticRetinopathy,
  syncDiabeticRetinopathy,
} from './pipelines/DiabeticRetinopathyPipeline';
import { disposeFloaters, syncFloaters } from './pipelines/FloatersPipeline';
import { disposeGlaucoma, syncGlaucoma } from './pipelines/GlaucomaPipeline';
import { disposeMigraineAura, syncMigraineAura } from './pipelines/MigraineAuraPipeline';
import {
  disposeRetinitisPigmentosa,
  syncRetinitisPigmentosa,
} from './pipelines/RetinitisPigmentosaPipeline';

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
let scene: Phaser.Scene | null = null;
let stopWatch: (() => void) | null = null;

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

/** Resolves which side's value to feed into each of the pipeline's L/R
 *  inputs given the active viewMode. The pipelines themselves blend their
 *  L/R inputs (averaging for numerics, winner-takes-all for enums), so:
 *
 *    - 'left'    → return [L, L]   pipeline sees only L's value
 *    - 'right'   → return [R, R]   pipeline sees only R's value
 *    - 'both'    → return [L, R]   pipeline averages naturally
 *    - 'split'   → return [L, R]   per-eye rendering is 7.2's job; for
 *                                  7.1 we treat split the same as both.
 *
 *  This means a viewMode change only edits the manager's plumbing — none
 *  of the per-condition pipelines need to know viewMode exists. */
function pickPair<T>(viewMode: ViewMode, l: T, r: T): readonly [T, T] {
  if (viewMode === 'left') return [l, l];
  if (viewMode === 'right') return [r, r];
  return [l, r];
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

function syncBlurFromStore(
  eye: ReturnType<typeof useEyeSettingsStore>,
  viewMode: ViewMode,
  cam: Phaser.Cameras.Scene2D.Camera,
): void {
  const l = combinedBlur(eye.left as BlurSide);
  const r = combinedBlur(eye.right as BlurSide);
  const [actL, actR] = pickPair(viewMode, l.active, r.active);
  const [sL, sR] = pickPair(viewMode, l.strength, r.strength);
  syncBlur(cam, {
    leftActive: actL,
    leftStrength: sL,
    rightActive: actR,
    rightStrength: sR,
  });
}

function syncAstigmatismFromStore(
  eye: ReturnType<typeof useEyeSettingsStore>,
  viewMode: ViewMode,
  cam: Phaser.Cameras.Scene2D.Camera,
): void {
  const [actL, actR] = pickPair(viewMode, eye.left.astigmatism.enabled, eye.right.astigmatism.enabled);
  const [mL, mR] = pickPair(viewMode, eye.left.astigmatism.magnitude, eye.right.astigmatism.magnitude);
  const [axL, axR] = pickPair(viewMode, eye.left.astigmatism.axis, eye.right.astigmatism.axis);
  syncAstigmatism(cam, {
    leftActive: actL,
    leftMagnitude: mL,
    leftAxis: axL,
    rightActive: actR,
    rightMagnitude: mR,
    rightAxis: axR,
  });
}

function syncColorVisionFromStore(
  eye: ReturnType<typeof useEyeSettingsStore>,
  viewMode: ViewMode,
  cam: Phaser.Cameras.Scene2D.Camera,
): void {
  const [actL, actR] = pickPair(viewMode, eye.left.colorVision.enabled, eye.right.colorVision.enabled);
  const [tL, tR] = pickPair(viewMode, eye.left.colorVision.type, eye.right.colorVision.type);
  const [sevL, sevR] = pickPair(viewMode, eye.left.colorVision.severity, eye.right.colorVision.severity);
  syncColorVision(cam, {
    leftActive: actL,
    leftType: tL,
    leftSeverity: sevL,
    rightActive: actR,
    rightType: tR,
    rightSeverity: sevR,
  });
}

function syncCataractFromStore(
  eye: ReturnType<typeof useEyeSettingsStore>,
  viewMode: ViewMode,
  cam: Phaser.Cameras.Scene2D.Camera,
): void {
  const [actL, actR] = pickPair(viewMode, eye.left.cataract.enabled, eye.right.cataract.enabled);
  const [clL, clR] = pickPair(viewMode, eye.left.cataract.cloudiness, eye.right.cataract.cloudiness);
  const [yL, yR] = pickPair(viewMode, eye.left.cataract.yellowing, eye.right.cataract.yellowing);
  const [bL, bR] = pickPair(viewMode, eye.left.cataract.brightnessLoss, eye.right.cataract.brightnessLoss);
  syncCataract(cam, {
    leftActive: actL,
    leftCloudiness: clL,
    leftYellowing: yL,
    leftBrightnessLoss: bL,
    rightActive: actR,
    rightCloudiness: clR,
    rightYellowing: yR,
    rightBrightnessLoss: bR,
  });
}

function syncGlaucomaFromStore(
  eye: ReturnType<typeof useEyeSettingsStore>,
  viewMode: ViewMode,
  cam: Phaser.Cameras.Scene2D.Camera,
): void {
  const [actL, actR] = pickPair(viewMode, eye.left.glaucoma.enabled, eye.right.glaucoma.enabled);
  const [rL, rR] = pickPair(viewMode, eye.left.glaucoma.innerRadius, eye.right.glaucoma.innerRadius);
  const [sevL, sevR] = pickPair(viewMode, eye.left.glaucoma.severity, eye.right.glaucoma.severity);
  syncGlaucoma(cam, {
    leftActive: actL,
    leftInnerRadius: rL,
    leftSeverity: sevL,
    rightActive: actR,
    rightInnerRadius: rR,
    rightSeverity: sevR,
  });
}

function syncRetinitisPigmentosaFromStore(
  eye: ReturnType<typeof useEyeSettingsStore>,
  viewMode: ViewMode,
  cam: Phaser.Cameras.Scene2D.Camera,
): void {
  const [actL, actR] = pickPair(
    viewMode,
    eye.left.retinitisPigmentosa.enabled,
    eye.right.retinitisPigmentosa.enabled,
  );
  const [tL, tR] = pickPair(
    viewMode,
    eye.left.retinitisPigmentosa.tunnelRadius,
    eye.right.retinitisPigmentosa.tunnelRadius,
  );
  const [bL, bR] = pickPair(
    viewMode,
    eye.left.retinitisPigmentosa.brightnessLoss,
    eye.right.retinitisPigmentosa.brightnessLoss,
  );
  syncRetinitisPigmentosa(cam, {
    leftActive: actL,
    leftTunnelRadius: tL,
    leftBrightnessLoss: bL,
    rightActive: actR,
    rightTunnelRadius: tR,
    rightBrightnessLoss: bR,
  });
}

function syncAmdFromStore(
  eye: ReturnType<typeof useEyeSettingsStore>,
  viewMode: ViewMode,
  cam: Phaser.Cameras.Scene2D.Camera,
): void {
  if (scene === null) return;
  const [actL, actR] = pickPair(viewMode, eye.left.amd.enabled, eye.right.amd.enabled);
  const [sL, sR] = pickPair(viewMode, eye.left.amd.scotomaRadius, eye.right.amd.scotomaRadius);
  const [fL, fR] = pickPair(viewMode, eye.left.amd.falloff, eye.right.amd.falloff);
  const [dL, dR] = pickPair(viewMode, eye.left.amd.distortion, eye.right.amd.distortion);
  syncAmd(scene, cam, {
    leftActive: actL,
    leftScotomaRadius: sL,
    leftFalloff: fL,
    leftDistortion: dL,
    rightActive: actR,
    rightScotomaRadius: sR,
    rightFalloff: fR,
    rightDistortion: dR,
  });
}

function syncDrFromStore(
  eye: ReturnType<typeof useEyeSettingsStore>,
  viewMode: ViewMode,
  cam: Phaser.Cameras.Scene2D.Camera,
): void {
  if (scene === null) return;
  const [actL, actR] = pickPair(
    viewMode,
    eye.left.diabeticRetinopathy.enabled,
    eye.right.diabeticRetinopathy.enabled,
  );
  const [cL, cR] = pickPair(
    viewMode,
    eye.left.diabeticRetinopathy.spotCount,
    eye.right.diabeticRetinopathy.spotCount,
  );
  const [zL, zR] = pickPair(
    viewMode,
    eye.left.diabeticRetinopathy.spotSize,
    eye.right.diabeticRetinopathy.spotSize,
  );
  const [sevL, sevR] = pickPair(
    viewMode,
    eye.left.diabeticRetinopathy.severity,
    eye.right.diabeticRetinopathy.severity,
  );
  syncDiabeticRetinopathy(scene, cam, {
    leftActive: actL,
    leftSpotCount: cL,
    leftSpotSize: zL,
    leftSeverity: sevL,
    rightActive: actR,
    rightSpotCount: cR,
    rightSpotSize: zR,
    rightSeverity: sevR,
  });
}

/** Runs every camera-filter sync against one camera with a single viewMode.
 *  Called once with main camera in single-camera modes; called twice in
 *  split mode (once per side camera, with viewMode='left'/'right'). */
function syncFilterPipelinesForCamera(
  eye: ReturnType<typeof useEyeSettingsStore>,
  viewMode: ViewMode,
  cam: Phaser.Cameras.Scene2D.Camera,
): void {
  syncColorVisionFromStore(eye, viewMode, cam);
  syncCataractFromStore(eye, viewMode, cam);
  syncBlurFromStore(eye, viewMode, cam);
  syncAstigmatismFromStore(eye, viewMode, cam);
  syncAmdFromStore(eye, viewMode, cam);
  syncGlaucomaFromStore(eye, viewMode, cam);
  syncRetinitisPigmentosaFromStore(eye, viewMode, cam);
  syncDrFromStore(eye, viewMode, cam);
}

/** Removes every filter from one camera. Used when switching modes so we
 *  don't carry orphan filters from the previously-active camera set. */
function disposeAllFiltersOn(cam: Phaser.Cameras.Scene2D.Camera): void {
  disposeColorVision(cam);
  disposeCataract(cam);
  disposeBlur(cam);
  disposeAstigmatism(cam);
  disposeAmd(cam);
  disposeGlaucoma(cam);
  disposeRetinitisPigmentosa(cam);
  disposeDiabeticRetinopathy(cam);
}

function syncFloatersFromStore(
  eye: ReturnType<typeof useEyeSettingsStore>,
  viewMode: ViewMode,
): void {
  if (scene === null) return;
  const [actL, actR] = pickPair(viewMode, eye.left.floaters.enabled, eye.right.floaters.enabled);
  const [cL, cR] = pickPair(viewMode, eye.left.floaters.count, eye.right.floaters.count);
  const [zL, zR] = pickPair(viewMode, eye.left.floaters.size, eye.right.floaters.size);
  const [oL, oR] = pickPair(viewMode, eye.left.floaters.opacity, eye.right.floaters.opacity);
  const [anL, anR] = pickPair(viewMode, eye.left.floaters.animate, eye.right.floaters.animate);
  syncFloaters(scene, {
    leftActive: actL,
    leftCount: cL,
    leftSize: zL,
    leftOpacity: oL,
    leftAnimate: anL,
    rightActive: actR,
    rightCount: cR,
    rightSize: zR,
    rightOpacity: oR,
    rightAnimate: anR,
  });
}

function syncMigraineAuraFromStore(
  eye: ReturnType<typeof useEyeSettingsStore>,
  viewMode: ViewMode,
): void {
  if (scene === null) return;
  const [actL, actR] = pickPair(viewMode, eye.left.migraineAura.enabled, eye.right.migraineAura.enabled);
  const [rL, rR] = pickPair(viewMode, eye.left.migraineAura.radius, eye.right.migraineAura.radius);
  const [xL, xR] = pickPair(
    viewMode,
    eye.left.migraineAura.positionX,
    eye.right.migraineAura.positionX,
  );
  const [yL, yR] = pickPair(
    viewMode,
    eye.left.migraineAura.positionY,
    eye.right.migraineAura.positionY,
  );
  const [anL, anR] = pickPair(viewMode, eye.left.migraineAura.animate, eye.right.migraineAura.animate);
  syncMigraineAura(scene, {
    leftActive: actL,
    leftRadius: rL,
    leftPositionX: xL,
    leftPositionY: yL,
    leftAnimate: anL,
    rightActive: actR,
    rightRadius: rR,
    rightPositionX: xR,
    rightPositionY: yR,
    rightAnimate: anR,
  });
}

export const pipelineManager: PipelineManager = {
  init(sceneArg): void {
    if (camera !== null && stopWatch !== null) {
      // Re-init: tear down the old watcher + filters so we don't double-up.
      stopWatch();
      disposeAllFiltersOn(camera);
      const visionScene = scene as VisionScene | null;
      if (visionScene?.leftSplitCamera) disposeAllFiltersOn(visionScene.leftSplitCamera);
      if (visionScene?.rightSplitCamera) disposeAllFiltersOn(visionScene.rightSplitCamera);
      disposeFloaters();
      disposeMigraineAura();
    }
    scene = sceneArg;
    camera = sceneArg.cameras.main;
    const eye = useEyeSettingsStore();
    const view = useViewSettingsStore();
    stopWatch = watch(
      () => [eye.left, eye.right, view.viewMode] as [EyeSettings, EyeSettings, ViewMode],
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
    if (camera === null || scene === null) return;
    const eye = useEyeSettingsStore();
    const view = useViewSettingsStore();
    const viewMode = view.viewMode;
    const visionScene = scene as VisionScene;
    const leftSplit = visionScene.leftSplitCamera;
    const rightSplit = visionScene.rightSplitCamera;

    if (viewMode === 'split' && leftSplit !== null && rightSplit !== null) {
      // Move filters from the main camera to the two halves. Each split
      // camera gets its own filter stack derived from its eye's params.
      disposeAllFiltersOn(camera);
      visionScene.setSplitMode(true);
      syncFilterPipelinesForCamera(eye, 'left', leftSplit);
      syncFilterPipelinesForCamera(eye, 'right', rightSplit);
    } else {
      // Single-camera modes (both / left / right). Make sure no leftover
      // split-camera filters are still attached, then sync main.
      if (leftSplit !== null) disposeAllFiltersOn(leftSplit);
      if (rightSplit !== null) disposeAllFiltersOn(rightSplit);
      visionScene.setSplitMode(false);
      syncFilterPipelinesForCamera(eye, viewMode, camera);
    }

    // Sprite-based pipelines (Floaters, Migraine aura) are scene-wide
    // game objects, not camera filters. They render through every visible
    // camera, so we sync them once with viewMode-aware blending regardless
    // of which camera set is currently active.
    syncFloatersFromStore(eye, viewMode);
    syncMigraineAuraFromStore(eye, viewMode);
    // Custom mask wires up in Phase 8.x.
  },
};
