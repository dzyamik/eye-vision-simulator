// Glaucoma — peripheral-vision-loss vignette. Driven by Phaser's built-in
// Filters.Vignette. The store's `innerRadius` becomes Vignette.radius
// (size of the preserved central area); `severity` becomes
// Vignette.strength (how dark the periphery gets).
//
// Limitation: the spec's `feather` (gradient softness) doesn't map to
// Phaser's Vignette directly — Phaser's falloff curve is fixed. The slider
// still writes to the store but currently has no visible effect; v1.1 can
// swap to a custom shader if a tunable feather matters. Documented in the
// store/UI; the slider stays so future work doesn't need a UI revisit.

import type Phaser from 'phaser';

const ACTIVE_THRESHOLD = 0.005;

interface GlaucomaParams {
  leftActive: boolean;
  leftInnerRadius: number;
  leftSeverity: number;
  rightActive: boolean;
  rightInnerRadius: number;
  rightSeverity: number;
}

const filters = new WeakMap<Phaser.Cameras.Scene2D.Camera, Phaser.Filters.Vignette>();

export function syncGlaucoma(
  camera: Phaser.Cameras.Scene2D.Camera,
  params: GlaucomaParams,
): void {
  const anyActive = params.leftActive || params.rightActive;
  const radius = (params.leftInnerRadius + params.rightInnerRadius) / 2;
  const severity = (params.leftSeverity + params.rightSeverity) / 2;
  const effective = anyActive && severity > ACTIVE_THRESHOLD;
  let filter = filters.get(camera) ?? null;

  if (effective) {
    if (filter === null) {
      filter = camera.filters.internal.addVignette(0.5, 0.5, radius, severity);
      filters.set(camera, filter);
    }
    filter.radius = radius;
    filter.strength = severity;
  } else if (filter !== null) {
    camera.filters.internal.remove(filter);
    filters.delete(camera);
  }
}

export function disposeGlaucoma(camera: Phaser.Cameras.Scene2D.Camera): void {
  const filter = filters.get(camera);
  if (filter !== undefined) {
    camera.filters.internal.remove(filter);
    filters.delete(camera);
  }
}
