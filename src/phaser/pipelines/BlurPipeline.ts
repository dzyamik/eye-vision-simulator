// Adapter around Phaser 4's built-in Filters.Blur. We use the built-in
// rather than rolling our own separable Gaussian (the GLSL in
// dev-docs/04-shaders-reference.md §Blur) because Phaser's implementation is
// exactly that algorithm with quality variants and pre-tuned shader paths.
// If we later need a custom blur (e.g. anisotropic for astigmatism — that's
// 6.3, separate filter), the reference GLSL is still on hand.
//
// One Blur filter per camera (singleton inside this module). Three
// conditions (myopia / hyperopia / presbyopia) feed a single combined
// strength because they all simulate the same uniform blur effect; the
// pipelineManager sums and clamps before calling syncBlur.

import type Phaser from 'phaser';

// Tuned in dev preview — feel free to adjust per visual taste. Phaser's
// `strength` is roughly "how much to multiply the per-step offset by", so 4
// gives a clearly visible blur at full strength without going to mush.
const MAX_BLUR_STRENGTH = 4;
// Below this combined strength we detach the filter entirely so we don't
// pay per-frame GPU cost for a no-op.
const ACTIVE_THRESHOLD = 0.005;

interface BlurParams {
  leftActive: boolean;
  leftStrength: number;
  rightActive: boolean;
  rightStrength: number;
}

let filter: Phaser.Filters.Blur | null = null;

export function syncBlur(camera: Phaser.Cameras.Scene2D.Camera, params: BlurParams): void {
  const anyActive = params.leftActive || params.rightActive;
  // Phase 7's view modes (left-only / right-only / split) will refactor
  // this; for Phase 6 we simply average the two sides and apply the result
  // camera-wide. Both eyes blended is the default view mode anyway.
  const blendedStrength = (params.leftStrength + params.rightStrength) / 2;

  if (anyActive && blendedStrength > ACTIVE_THRESHOLD) {
    if (filter === null) {
      // addBlur(quality, x, y, strength, color, steps) per Phaser.Filters.Blur.
      // quality: 0 = low-cost good-enough Gaussian. x,y: per-step offset.
      filter = camera.filters.internal.addBlur(0, 2, 2, 1, 0xffffff, 4);
    }
    filter.strength = blendedStrength * MAX_BLUR_STRENGTH;
  } else if (filter !== null) {
    camera.filters.internal.remove(filter);
    filter = null;
  }
}

/** Detach + drop the filter ref. Useful if pipelineManager.init() is called
 *  again (e.g. after Phaser game teardown + recreate during HMR). */
export function disposeBlur(camera: Phaser.Cameras.Scene2D.Camera): void {
  if (filter !== null) {
    camera.filters.internal.remove(filter);
    filter = null;
  }
}
