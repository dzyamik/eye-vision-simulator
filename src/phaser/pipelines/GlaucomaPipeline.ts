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

let filter: Phaser.Filters.Vignette | null = null;

export function syncGlaucoma(
  camera: Phaser.Cameras.Scene2D.Camera,
  params: GlaucomaParams,
): void {
  const anyActive = params.leftActive || params.rightActive;
  // Phase 6 averages both eyes; Phase 7's view modes split per side.
  // For radius we average; for severity we average too. When only one side
  // is active, the other contributes 0 to severity (so anti-correlation
  // collapses to that side's value at half strength). This is acceptable
  // for the blend-both-eyes default view; per-eye fidelity arrives in 7.x.
  const radius = (params.leftInnerRadius + params.rightInnerRadius) / 2;
  const severity = (params.leftSeverity + params.rightSeverity) / 2;
  const effective = anyActive && severity > ACTIVE_THRESHOLD;

  if (effective) {
    if (filter === null) {
      filter = camera.filters.internal.addVignette(0.5, 0.5, radius, severity);
    }
    filter.radius = radius;
    filter.strength = severity;
  } else if (filter !== null) {
    camera.filters.internal.remove(filter);
    filter = null;
  }
}

export function disposeGlaucoma(camera: Phaser.Cameras.Scene2D.Camera): void {
  if (filter !== null) {
    camera.filters.internal.remove(filter);
    filter = null;
  }
}
