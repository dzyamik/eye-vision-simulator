// 3×3 color-vision-deficiency matrices in linear sRGB, applied row-major
// (each group of three is one output channel: r' = a*r + b*g + c*b, etc.).
// Source: Machado-derived dichromacy matrices, validated against
// Brettel/Viénot/Mollon (1997). See dev-docs/04-shaders-reference.md.
//
// Anomaly variants (protanomaly/deuteranomaly/tritanomaly) ship with their
// own dedicated matrices here; the user can also fine-tune via the severity
// slider, which in the shader interpolates between identity and this matrix.

import type { ColorVisionType } from '@/types/eyeSettings';

export type ColorMatrix = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export const COLOR_MATRICES = {
  normal: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  protanopia: [0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0.242, 0.758],
  deuteranopia: [0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7],
  tritanopia: [0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525],
  protanomaly: [0.817, 0.183, 0, 0.333, 0.667, 0, 0, 0.125, 0.875],
  deuteranomaly: [0.8, 0.2, 0, 0.258, 0.742, 0, 0, 0.142, 0.858],
  tritanomaly: [0.967, 0.033, 0, 0, 0.733, 0.267, 0, 0.183, 0.817],
  achromatopsia: [0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114],
} as const satisfies Record<ColorVisionType, ColorMatrix>;
