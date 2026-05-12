// Retinitis pigmentosa — like glaucoma but tighter and with a brightness
// drop inside the visible region too (the "night blindness" component).
// Two stacked filters per spec (dev-docs/03-eye-conditions.md):
//   - ColorMatrix: uniform brightness multiplier across all channels.
//     Runs first so the vignette's preserved area is also dimmed.
//   - Vignette: tunnelRadius + max strength (RP is severe by definition).
//
// Limitation: still uses Phaser's built-in Vignette (fixed falloff), so the
// store's RP `feather` slider isn't forwarded here and has no visible
// effect. Glaucoma was migrated to a custom shader in v1; per the spec
// (`04-shaders-reference.md` §Glaucoma) RP shares that shader's logic and
// can reuse `GlaucomaFilter` plus a brightness term in v1.1.

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

interface RpFilters {
  matrix: Phaser.Filters.ColorMatrix | null;
  vignette: Phaser.Filters.Vignette | null;
}
const filters = new WeakMap<Phaser.Cameras.Scene2D.Camera, RpFilters>();

function getOrInit(camera: Phaser.Cameras.Scene2D.Camera): RpFilters {
  let entry = filters.get(camera);
  if (entry === undefined) {
    entry = { matrix: null, vignette: null };
    filters.set(camera, entry);
  }
  return entry;
}

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
  const entry = getOrInit(camera);

  if (anyActive) {
    if (brightnessLoss > ACTIVE_THRESHOLD) {
      const scale = 1 - brightnessLoss;
      if (entry.matrix === null) {
        entry.matrix = camera.filters.internal.addColorMatrix();
      }
      entry.matrix.colorMatrix.set(buildBrightnessMatrix(scale));
      entry.matrix.colorMatrix.alpha = 1;
    } else if (entry.matrix !== null) {
      camera.filters.internal.remove(entry.matrix);
      entry.matrix = null;
    }

    if (entry.vignette === null) {
      entry.vignette = camera.filters.internal.addVignette(0.5, 0.5, radius, VIGNETTE_STRENGTH);
    }
    entry.vignette.radius = radius;
    entry.vignette.strength = VIGNETTE_STRENGTH;
  } else {
    if (entry.matrix !== null) {
      camera.filters.internal.remove(entry.matrix);
      entry.matrix = null;
    }
    if (entry.vignette !== null) {
      camera.filters.internal.remove(entry.vignette);
      entry.vignette = null;
    }
  }
}

export function disposeRetinitisPigmentosa(camera: Phaser.Cameras.Scene2D.Camera): void {
  const entry = filters.get(camera);
  if (entry === undefined) return;
  if (entry.matrix !== null) camera.filters.internal.remove(entry.matrix);
  if (entry.vignette !== null) camera.filters.internal.remove(entry.vignette);
  filters.delete(camera);
}
