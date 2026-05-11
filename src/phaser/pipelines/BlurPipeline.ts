// Adapter around Phaser 4's built-in Filters.Blur. We use the built-in
// rather than rolling our own separable Gaussian (the GLSL in
// dev-docs/04-shaders-reference.md §Blur) because Phaser's implementation is
// exactly that algorithm with quality variants and pre-tuned shader paths.
//
// State is per-camera (WeakMap keyed by camera) so the same module can
// drive separate Blur filters on the main camera and on each of the
// split-view cameras. Three conditions (myopia / hyperopia / presbyopia)
// feed a single combined strength; the pipelineManager sums and clamps
// before calling syncBlur.

import type Phaser from 'phaser';

const MAX_BLUR_STRENGTH = 4;
const ACTIVE_THRESHOLD = 0.005;

interface BlurParams {
  leftActive: boolean;
  leftStrength: number;
  rightActive: boolean;
  rightStrength: number;
}

const filters = new WeakMap<Phaser.Cameras.Scene2D.Camera, Phaser.Filters.Blur>();

export function syncBlur(camera: Phaser.Cameras.Scene2D.Camera, params: BlurParams): void {
  const anyActive = params.leftActive || params.rightActive;
  const blendedStrength = (params.leftStrength + params.rightStrength) / 2;
  let filter = filters.get(camera) ?? null;

  if (anyActive && blendedStrength > ACTIVE_THRESHOLD) {
    if (filter === null) {
      filter = camera.filters.internal.addBlur(0, 2, 2, 1, 0xffffff, 4);
      filters.set(camera, filter);
    }
    filter.strength = blendedStrength * MAX_BLUR_STRENGTH;
  } else if (filter !== null) {
    camera.filters.internal.remove(filter);
    filters.delete(camera);
  }
}

export function disposeBlur(camera: Phaser.Cameras.Scene2D.Camera): void {
  const filter = filters.get(camera);
  if (filter !== undefined) {
    camera.filters.internal.remove(filter);
    filters.delete(camera);
  }
}
