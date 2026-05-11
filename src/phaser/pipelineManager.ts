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

function syncColorVisionFromStore(eye: ReturnType<typeof useEyeSettingsStore>): void {
  if (camera === null) return;
  syncColorVision(camera, {
    leftActive: eye.left.colorVision.enabled,
    leftType: eye.left.colorVision.type,
    leftSeverity: eye.left.colorVision.severity,
    rightActive: eye.right.colorVision.enabled,
    rightType: eye.right.colorVision.type,
    rightSeverity: eye.right.colorVision.severity,
  });
}

function syncCataractFromStore(eye: ReturnType<typeof useEyeSettingsStore>): void {
  if (camera === null) return;
  syncCataract(camera, {
    leftActive: eye.left.cataract.enabled,
    leftCloudiness: eye.left.cataract.cloudiness,
    leftYellowing: eye.left.cataract.yellowing,
    leftBrightnessLoss: eye.left.cataract.brightnessLoss,
    rightActive: eye.right.cataract.enabled,
    rightCloudiness: eye.right.cataract.cloudiness,
    rightYellowing: eye.right.cataract.yellowing,
    rightBrightnessLoss: eye.right.cataract.brightnessLoss,
  });
}

function syncGlaucomaFromStore(eye: ReturnType<typeof useEyeSettingsStore>): void {
  if (camera === null) return;
  syncGlaucoma(camera, {
    leftActive: eye.left.glaucoma.enabled,
    leftInnerRadius: eye.left.glaucoma.innerRadius,
    leftSeverity: eye.left.glaucoma.severity,
    rightActive: eye.right.glaucoma.enabled,
    rightInnerRadius: eye.right.glaucoma.innerRadius,
    rightSeverity: eye.right.glaucoma.severity,
  });
}

function syncRetinitisPigmentosaFromStore(eye: ReturnType<typeof useEyeSettingsStore>): void {
  if (camera === null) return;
  syncRetinitisPigmentosa(camera, {
    leftActive: eye.left.retinitisPigmentosa.enabled,
    leftTunnelRadius: eye.left.retinitisPigmentosa.tunnelRadius,
    leftBrightnessLoss: eye.left.retinitisPigmentosa.brightnessLoss,
    rightActive: eye.right.retinitisPigmentosa.enabled,
    rightTunnelRadius: eye.right.retinitisPigmentosa.tunnelRadius,
    rightBrightnessLoss: eye.right.retinitisPigmentosa.brightnessLoss,
  });
}

function syncAmdFromStore(eye: ReturnType<typeof useEyeSettingsStore>): void {
  if (camera === null || scene === null) return;
  syncAmd(scene, camera, {
    leftActive: eye.left.amd.enabled,
    leftScotomaRadius: eye.left.amd.scotomaRadius,
    leftFalloff: eye.left.amd.falloff,
    leftDistortion: eye.left.amd.distortion,
    rightActive: eye.right.amd.enabled,
    rightScotomaRadius: eye.right.amd.scotomaRadius,
    rightFalloff: eye.right.amd.falloff,
    rightDistortion: eye.right.amd.distortion,
  });
}

function syncDrFromStore(eye: ReturnType<typeof useEyeSettingsStore>): void {
  if (camera === null || scene === null) return;
  syncDiabeticRetinopathy(scene, camera, {
    leftActive: eye.left.diabeticRetinopathy.enabled,
    leftSpotCount: eye.left.diabeticRetinopathy.spotCount,
    leftSpotSize: eye.left.diabeticRetinopathy.spotSize,
    leftSeverity: eye.left.diabeticRetinopathy.severity,
    rightActive: eye.right.diabeticRetinopathy.enabled,
    rightSpotCount: eye.right.diabeticRetinopathy.spotCount,
    rightSpotSize: eye.right.diabeticRetinopathy.spotSize,
    rightSeverity: eye.right.diabeticRetinopathy.severity,
  });
}

function syncFloatersFromStore(eye: ReturnType<typeof useEyeSettingsStore>): void {
  if (scene === null) return;
  syncFloaters(scene, {
    leftActive: eye.left.floaters.enabled,
    leftCount: eye.left.floaters.count,
    leftSize: eye.left.floaters.size,
    leftOpacity: eye.left.floaters.opacity,
    leftAnimate: eye.left.floaters.animate,
    rightActive: eye.right.floaters.enabled,
    rightCount: eye.right.floaters.count,
    rightSize: eye.right.floaters.size,
    rightOpacity: eye.right.floaters.opacity,
    rightAnimate: eye.right.floaters.animate,
  });
}

export const pipelineManager: PipelineManager = {
  init(sceneArg): void {
    if (camera !== null && stopWatch !== null) {
      // Re-init: tear down the old watcher + filters so we don't double-up.
      stopWatch();
      disposeBlur(camera);
      disposeAstigmatism(camera);
      disposeColorVision(camera);
      disposeCataract(camera);
      disposeGlaucoma(camera);
      disposeRetinitisPigmentosa(camera);
      disposeAmd(camera);
      disposeDiabeticRetinopathy(camera);
      disposeFloaters();
    }
    scene = sceneArg;
    camera = sceneArg.cameras.main;
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
    // STACKING_ORDER says colorVision runs first; we call it first here, but
    // Phaser actually runs filters in the order they were attached, which
    // depends on activation timing. A future cleanup will sort camera.filters
    // by STACKING_ORDER. For now color-then-blur visually approximates the
    // intended pipeline.
    syncColorVisionFromStore(eye);
    syncCataractFromStore(eye);
    syncBlurFromStore(eye);
    syncAstigmatismFromStore(eye);
    syncAmdFromStore(eye);
    syncGlaucomaFromStore(eye);
    syncRetinitisPigmentosaFromStore(eye);
    syncDrFromStore(eye);
    syncFloatersFromStore(eye);
    // 6.10+ adds migraine aura (sprite overlay) and the custom mask (8.x).
  },
};
