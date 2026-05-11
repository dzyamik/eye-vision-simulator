// Custom-mask compositor: takes the painted ImageData from
// eyeSettings[side].customMask.maskData, uploads it as a Phaser
// CanvasTexture, and stacks a Blend filter that darkens the camera output
// where the mask's alpha is non-zero. v1 only implements the `darken`
// effect — blur and desaturate are stubbed and reserved for v1.1.
//
// Per-camera state (WeakMap) so the same module drives separate filters
// on main, leftSplit, and rightSplit. Texture keys are also per-camera so
// L's and R's masks don't collide in TextureManager when split view is on.
//
// Texture re-upload is gated on ImageData reference equality — MaskPanel
// pushes a fresh ImageData on each pointer-up, which fails identity vs
// the cached one and triggers a putImageData + refresh().

import Phaser from 'phaser';

import type { MaskEffect } from '@/types/eyeSettings';

const ACTIVE_THRESHOLD = 0.005;

interface CustomMaskParams {
  leftActive: boolean;
  leftMaskData: ImageData | null;
  leftIntensity: number;
  leftEffect: MaskEffect;
  rightActive: boolean;
  rightMaskData: ImageData | null;
  rightIntensity: number;
  rightEffect: MaskEffect;
}

interface PipelineState {
  filter: Phaser.Filters.Blend | null;
  textureKey: string | null;
  lastMaskData: ImageData | null;
}

const states = new WeakMap<Phaser.Cameras.Scene2D.Camera, PipelineState>();
let textureIdCounter = 0;

function getOrInit(camera: Phaser.Cameras.Scene2D.Camera): PipelineState {
  let s = states.get(camera);
  if (s === undefined) {
    s = { filter: null, textureKey: null, lastMaskData: null };
    states.set(camera, s);
  }
  return s;
}

function uploadMask(
  scene: Phaser.Scene,
  key: string,
  maskData: ImageData,
): void {
  let canvasTexture: Phaser.Textures.CanvasTexture;
  if (scene.textures.exists(key)) {
    canvasTexture = scene.textures.get(key) as Phaser.Textures.CanvasTexture;
    if (
      canvasTexture.canvas.width !== maskData.width ||
      canvasTexture.canvas.height !== maskData.height
    ) {
      // Resolution changed (shouldn't happen with our fixed 512×512 but
      // covered for safety) — drop and recreate.
      scene.textures.remove(key);
      canvasTexture = createCanvasTexture(scene, key, maskData.width, maskData.height);
    }
  } else {
    canvasTexture = createCanvasTexture(scene, key, maskData.width, maskData.height);
  }
  const ctx = canvasTexture.canvas.getContext('2d');
  if (ctx === null) return;
  ctx.putImageData(maskData, 0, 0);
  canvasTexture.refresh();
}

function createCanvasTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
): Phaser.Textures.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return scene.textures.addCanvas(key, canvas) as Phaser.Textures.CanvasTexture;
}

interface Effective {
  maskData: ImageData;
  intensity: number;
  effect: MaskEffect;
}

function pickEffective(params: CustomMaskParams): Effective | null {
  // In split mode pickPair() in pipelineManager already substitutes L's
  // values for R (or vice versa), so the L/R inputs here are identical
  // per camera. In single-camera modes we prefer L when active+has-data,
  // else R. That means in 'both' view mode you see L's mask; if you want
  // R's mask there, disable L or use split view. v1.1 could stack two
  // Blend filters to show both.
  if (params.leftActive && params.leftMaskData !== null) {
    return {
      maskData: params.leftMaskData,
      intensity: params.leftIntensity,
      effect: params.leftEffect,
    };
  }
  if (params.rightActive && params.rightMaskData !== null) {
    return {
      maskData: params.rightMaskData,
      intensity: params.rightIntensity,
      effect: params.rightEffect,
    };
  }
  return null;
}

export function syncCustomMask(
  scene: Phaser.Scene,
  camera: Phaser.Cameras.Scene2D.Camera,
  params: CustomMaskParams,
): void {
  const effective = pickEffective(params);
  const state = getOrInit(camera);
  // v1 only implements 'darken'. Other effects fall through to no-op:
  // the filter detaches and the impaired view remains unmasked. Easier
  // for users to understand "v1.1 coming" than a half-broken filter.
  const isDarken = effective?.effect === 'darken';
  const shouldRun =
    effective !== null && isDarken && effective.intensity > ACTIVE_THRESHOLD;

  if (shouldRun && effective !== null) {
    if (state.textureKey === null) {
      state.textureKey = `custom-mask-${++textureIdCounter}`;
    }
    if (state.lastMaskData !== effective.maskData) {
      uploadMask(scene, state.textureKey, effective.maskData);
      state.lastMaskData = effective.maskData;
    }
    if (state.filter === null) {
      state.filter = camera.filters.internal.addBlend(
        state.textureKey,
        Phaser.BlendModes.NORMAL,
        effective.intensity,
        [0, 0, 0, 1],
      );
    }
    state.filter.amount = effective.intensity;
  } else if (state.filter !== null) {
    camera.filters.internal.remove(state.filter);
    state.filter = null;
  }
}

export function disposeCustomMask(camera: Phaser.Cameras.Scene2D.Camera): void {
  const state = states.get(camera);
  if (state === undefined) return;
  if (state.filter !== null) camera.filters.internal.remove(state.filter);
  states.delete(camera);
  // The texture stays in TextureManager. Cleaning it up requires looking
  // up by key; not worth it — it's tiny (512×512 RGBA) and shared lookup
  // by key on next attach is cheap.
}
