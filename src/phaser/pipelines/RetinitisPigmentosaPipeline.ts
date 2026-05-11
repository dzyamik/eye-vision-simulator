// Retinitis pigmentosa — like glaucoma but tighter and with a brightness
// drop inside the visible region too (the "night blindness" component).
// Two stacked filters per spec (dev-docs/03-eye-conditions.md):
//   - ColorMatrix: uniform brightness multiplier across all channels.
//     Runs first so the vignette's preserved area is also dimmed.
//   - Vignette: tunnelRadius + max strength (RP is severe by definition).
//
// Same feather-limitation note as GlaucomaPipeline applies.

import type Phaser from 'phaser';

const ACTIVE_THRESHOLD = 0.005;
// Phaser's Vignette strength caps at 1; RP's tunnel-vision is described as
// dark-periphery-no-matter-what, so we lock strength to 1 whenever the
// condition is enabled. The user-facing tunability is the radius + the
// brightness loss inside.
const VIGNETTE_STRENGTH = 1;

interface RpParams {
  leftActive: boolean;
  leftTunnelRadius: number;
  leftBrightnessLoss: number;
  rightActive: boolean;
  rightTunnelRadius: number;
  rightBrightnessLoss: number;
}

let matrix: Phaser.Filters.ColorMatrix | null = null;
let vignette: Phaser.Filters.Vignette | null = null;

function buildBrightnessMatrix(scale: number): number[] {
  return [
    scale, 0, 0, 0, 0,
    0, scale, 0, 0, 0,
    0, 0, scale, 0, 0,
    0, 0, 0, 1, 0,
  ];
}

export function syncRetinitisPigmentosa(
  camera: Phaser.Cameras.Scene2D.Camera,
  params: RpParams,
): void {
  const anyActive = params.leftActive || params.rightActive;
  const radius = (params.leftTunnelRadius + params.rightTunnelRadius) / 2;
  const brightnessLoss = (params.leftBrightnessLoss + params.rightBrightnessLoss) / 2;
  const effective = anyActive;

  if (effective) {
    if (brightnessLoss > ACTIVE_THRESHOLD) {
      const scale = 1 - brightnessLoss;
      if (matrix === null) {
        matrix = camera.filters.internal.addColorMatrix();
      }
      matrix.colorMatrix.set(buildBrightnessMatrix(scale));
      matrix.colorMatrix.alpha = 1;
    } else if (matrix !== null) {
      camera.filters.internal.remove(matrix);
      matrix = null;
    }

    if (vignette === null) {
      vignette = camera.filters.internal.addVignette(0.5, 0.5, radius, VIGNETTE_STRENGTH);
    }
    vignette.radius = radius;
    vignette.strength = VIGNETTE_STRENGTH;
  } else {
    if (matrix !== null) {
      camera.filters.internal.remove(matrix);
      matrix = null;
    }
    if (vignette !== null) {
      camera.filters.internal.remove(vignette);
      vignette = null;
    }
  }
}

export function disposeRetinitisPigmentosa(camera: Phaser.Cameras.Scene2D.Camera): void {
  if (matrix !== null) {
    camera.filters.internal.remove(matrix);
    matrix = null;
  }
  if (vignette !== null) {
    camera.filters.internal.remove(vignette);
    vignette = null;
  }
}
