// Min/max/default/step for every numeric slider in the sidebar. Mirrors
// dev-docs/03-eye-conditions.md. The `default` values agree with
// createDefaultEyeSettings() in src/types/eyeSettings.ts — both are sourced
// from the same spec, so if you change a default, change it in both places.

import type { ConditionKey } from '@/types/eyeSettings';

export interface RangeSpec {
  readonly min: number;
  readonly max: number;
  readonly default: number;
  readonly step?: number;
}

export const RANGES = {
  myopia: {
    strength: { min: 0, max: 1, default: 0, step: 0.01 },
  },
  hyperopia: {
    strength: { min: 0, max: 1, default: 0, step: 0.01 },
  },
  presbyopia: {
    strength: { min: 0, max: 1, default: 0, step: 0.01 },
  },
  astigmatism: {
    magnitude: { min: 0, max: 1, default: 0, step: 0.01 },
    axis: { min: 0, max: 180, default: 0, step: 1 },
  },
  colorVision: {
    severity: { min: 0, max: 1, default: 1, step: 0.01 },
  },
  cataract: {
    cloudiness: { min: 0, max: 1, default: 0, step: 0.01 },
    yellowing: { min: 0, max: 1, default: 0, step: 0.01 },
    brightnessLoss: { min: 0, max: 1, default: 0, step: 0.01 },
    glare: { min: 0, max: 1, default: 0, step: 0.01 },
  },
  glaucoma: {
    innerRadius: { min: 0, max: 0.7, default: 0.7, step: 0.01 },
    feather: { min: 0, max: 0.3, default: 0.1, step: 0.01 },
    severity: { min: 0, max: 1, default: 1, step: 0.01 },
  },
  amd: {
    scotomaRadius: { min: 0, max: 0.5, default: 0, step: 0.01 },
    falloff: { min: 0, max: 0.3, default: 0.1, step: 0.01 },
    distortion: { min: 0, max: 1, default: 0, step: 0.01 },
  },
  diabeticRetinopathy: {
    spotCount: { min: 0, max: 40, default: 0, step: 1 },
    spotSize: { min: 0.01, max: 0.15, default: 0.05, step: 0.005 },
    severity: { min: 0, max: 1, default: 0, step: 0.01 },
  },
  retinitisPigmentosa: {
    tunnelRadius: { min: 0, max: 0.5, default: 0.3, step: 0.01 },
    feather: { min: 0, max: 0.2, default: 0.05, step: 0.01 },
    brightnessLoss: { min: 0, max: 0.7, default: 0.3, step: 0.01 },
  },
  floaters: {
    count: { min: 0, max: 20, default: 0, step: 1 },
    size: { min: 0.005, max: 0.05, default: 0.02, step: 0.005 },
    opacity: { min: 0, max: 1, default: 0.5, step: 0.01 },
  },
  migraineAura: {
    radius: { min: 0.05, max: 0.3, default: 0.15, step: 0.01 },
    positionX: { min: 0, max: 1, default: 0.5, step: 0.01 },
    positionY: { min: 0, max: 1, default: 0.5, step: 0.01 },
  },
  customMask: {
    intensity: { min: 0, max: 1, default: 1, step: 0.01 },
  },
} as const satisfies Record<ConditionKey, Record<string, RangeSpec>>;
