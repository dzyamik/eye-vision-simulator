// Compound cataract effect built from two stacked Phaser built-ins:
//   1. ColorMatrix: combined yellowing + brightness loss. Yellowing pulls
//      blue down and slightly tints green warm; brightness loss is a
//      uniform multiplicative dim.
//   2. Blend (with the procedural noise texture VisionScene seeds under
//      'cataract-noise'): a warm-grey cloud overlay modulated by noise.
//
// Glare (sub-effect #4 in dev-docs/03-eye-conditions.md §Cataracts) is
// not implemented in v1. Phaser doesn't ship a bloom-style filter, and
// rolling our own bloom is out of scope for this step. The three
// subtypes (nuclear / cortical / subcapsular) still produce visually
// distinct outputs via their preset yellowing/cloudiness/brightnessLoss
// combinations; subcapsular's distinctive glare lands in v1.1.
//
// Both-eye blend: average the four params. The Sidebar's CataractPanel
// applies subtype presets per eye, so users can already get e.g.
// "nuclear left, cortical right" pre-blend; Phase 7's view modes will
// expose these per-side rather than averaging.

import Phaser from 'phaser';

const ACTIVE_THRESHOLD = 0.005;
// Maximum mix toward warm-grey at cloudiness=1. At 1.0 the cloud would
// fully replace the image; 0.5 keeps enough of the underlying picture
// visible to still see what's there.
const MAX_CLOUDINESS = 0.5;
// Max channel scaling applied by brightness loss = brightnessLoss * this.
const MAX_BRIGHTNESS_LOSS = 0.7;
// Warm-grey tint applied to the noise texture for the cloud overlay.
const WARM_GREY: readonly [number, number, number, number] = [0.78, 0.78, 0.74, 1];

let matrix: Phaser.Filters.ColorMatrix | null = null;
let blend: Phaser.Filters.Blend | null = null;

interface CataractParams {
  leftActive: boolean;
  leftCloudiness: number;
  leftYellowing: number;
  leftBrightnessLoss: number;
  rightActive: boolean;
  rightCloudiness: number;
  rightYellowing: number;
  rightBrightnessLoss: number;
}

function buildMatrix(yellowing: number, brightnessLoss: number): number[] {
  // Yellowing: pull blue toward 60% of original, green to 95%. Linear in
  // the yellowing factor: at yellowing=0 → 1; at yellowing=1 → 0.6 for blue,
  // 0.95 for green.
  const blueScale = 1 - 0.4 * yellowing;
  const greenScale = 1 - 0.05 * yellowing;
  // Brightness loss: uniform scale across all channels.
  const bright = 1 - MAX_BRIGHTNESS_LOSS * brightnessLoss;
  return [
    bright, 0, 0, 0, 0,
    0, bright * greenScale, 0, 0, 0,
    0, 0, bright * blueScale, 0, 0,
    0, 0, 0, 1, 0,
  ];
}

export function syncCataract(
  camera: Phaser.Cameras.Scene2D.Camera,
  params: CataractParams,
): void {
  const anyActive = params.leftActive || params.rightActive;
  // Phase 6 averages both eyes; Phase 7 will split per view mode.
  const cloudiness = (params.leftCloudiness + params.rightCloudiness) / 2;
  const yellowing = (params.leftYellowing + params.rightYellowing) / 2;
  const brightnessLoss = (params.leftBrightnessLoss + params.rightBrightnessLoss) / 2;

  // An effective cataract needs at least one of yellowing / cloudiness /
  // brightnessLoss to be above the threshold (otherwise we'd attach two
  // expensive filters that do nothing).
  const effective =
    anyActive &&
    (yellowing > ACTIVE_THRESHOLD ||
      cloudiness > ACTIVE_THRESHOLD ||
      brightnessLoss > ACTIVE_THRESHOLD);

  if (effective) {
    if (matrix === null) {
      matrix = camera.filters.internal.addColorMatrix();
    }
    matrix.colorMatrix.set(buildMatrix(yellowing, brightnessLoss));
    matrix.colorMatrix.alpha = 1;

    if (cloudiness > ACTIVE_THRESHOLD) {
      if (blend === null) {
        blend = camera.filters.internal.addBlend(
          'cataract-noise',
          Phaser.BlendModes.NORMAL,
          cloudiness * MAX_CLOUDINESS,
          [...WARM_GREY],
        );
      }
      blend.amount = cloudiness * MAX_CLOUDINESS;
    } else if (blend !== null) {
      camera.filters.internal.remove(blend);
      blend = null;
    }
  } else {
    if (matrix !== null) {
      camera.filters.internal.remove(matrix);
      matrix = null;
    }
    if (blend !== null) {
      camera.filters.internal.remove(blend);
      blend = null;
    }
  }
}

export function disposeCataract(camera: Phaser.Cameras.Scene2D.Camera): void {
  if (matrix !== null) {
    camera.filters.internal.remove(matrix);
    matrix = null;
  }
  if (blend !== null) {
    camera.filters.internal.remove(blend);
    blend = null;
  }
}
