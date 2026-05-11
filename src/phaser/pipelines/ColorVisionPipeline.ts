// Color-vision-deficiency adapter around Phaser.Filters.ColorMatrix.
// Phaser's matrix shape is 4×5 (RGBA out × [R, G, B, A, offset]); our
// canonical matrices in src/constants/colorMatrices.ts are 3×3 in linear
// RGB. We pad to 4×5 with zeros and a passthrough alpha row.
//
// Severity is applied via the built-in ColorMatrix.alpha — Phaser blends
// the matrix output with the original colour by that fraction, which is
// the same lerp the spec asks for in dev-docs/04-shaders-reference.md
// §Color vision deficiency. Note: Phaser applies the matrix in sRGB
// (gamma) space, not linear; the deficiency matrices were derived for
// linear input. For most simulated outputs the visual difference is
// small enough not to warrant a custom shader yet — we can swap to one
// later if accuracy reports come back low.

import type Phaser from 'phaser';

import type { ColorMatrix } from '@/constants/colorMatrices';
import { COLOR_MATRICES } from '@/constants/colorMatrices';
import type { ColorVisionType } from '@/types/eyeSettings';

const ACTIVE_THRESHOLD = 0.005;

interface ColorVisionParams {
  leftActive: boolean;
  leftType: ColorVisionType;
  leftSeverity: number;
  rightActive: boolean;
  rightType: ColorVisionType;
  rightSeverity: number;
}

const filters = new WeakMap<Phaser.Cameras.Scene2D.Camera, Phaser.Filters.ColorMatrix>();

function pad(m: ColorMatrix): number[] {
  // 3×3 row-major → 4×5 row-major. The 4th column is RGBA scaling for the
  // alpha channel (1 = passthrough); the 5th column is per-channel offset
  // (all zero — no constant tint).
  return [
    m[0], m[1], m[2], 0, 0,
    m[3], m[4], m[5], 0, 0,
    m[6], m[7], m[8], 0, 0,
    0, 0, 0, 1, 0,
  ];
}

function pickEffective(
  params: ColorVisionParams,
): { type: ColorVisionType; severity: number } {
  // When both eyes are enabled, prefer a non-'normal' type; on conflict
  // the higher-severity side wins (left breaks ties). When only one side
  // is enabled, use that side. Phase 7's view-mode logic refines this.
  const lEff = params.leftActive && params.leftType !== 'normal';
  const rEff = params.rightActive && params.rightType !== 'normal';
  if (lEff && rEff) {
    if (params.leftType === params.rightType) {
      return {
        type: params.leftType,
        severity: (params.leftSeverity + params.rightSeverity) / 2,
      };
    }
    return params.leftSeverity >= params.rightSeverity
      ? { type: params.leftType, severity: params.leftSeverity }
      : { type: params.rightType, severity: params.rightSeverity };
  }
  if (lEff) return { type: params.leftType, severity: params.leftSeverity };
  if (rEff) return { type: params.rightType, severity: params.rightSeverity };
  return { type: 'normal', severity: 0 };
}

export function syncColorVision(
  camera: Phaser.Cameras.Scene2D.Camera,
  params: ColorVisionParams,
): void {
  const { type, severity } = pickEffective(params);
  const effective = type !== 'normal' && severity > ACTIVE_THRESHOLD;
  let filter = filters.get(camera) ?? null;

  if (effective) {
    if (filter === null) {
      filter = camera.filters.internal.addColorMatrix();
      filters.set(camera, filter);
    }
    filter.colorMatrix.set(pad(COLOR_MATRICES[type]));
    filter.colorMatrix.alpha = severity;
  } else if (filter !== null) {
    camera.filters.internal.remove(filter);
    filters.delete(camera);
  }
}

export function disposeColorVision(camera: Phaser.Cameras.Scene2D.Camera): void {
  const filter = filters.get(camera);
  if (filter !== undefined) {
    camera.filters.internal.remove(filter);
    filters.delete(camera);
  }
}
