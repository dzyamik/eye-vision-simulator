// Canonical per-eye state. Both Pinia stores and Phaser pipelines read from this shape;
// it is the single source of truth for what "an eye's settings" means in this app.
// See dev-docs/06-state-management.md for parameter semantics and dev-docs/03-eye-conditions.md
// for the meaning of each condition's fields.

export type ColorVisionType =
  | 'normal'
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia'
  | 'protanomaly'
  | 'deuteranomaly'
  | 'tritanomaly'
  | 'achromatopsia';

export type CataractSubtype = 'nuclear' | 'cortical' | 'subcapsular';

export type MaskEffect = 'darken' | 'blur' | 'desaturate';

export interface EyeSettings {
  myopia: { enabled: boolean; strength: number };
  hyperopia: { enabled: boolean; strength: number };
  presbyopia: { enabled: boolean; strength: number };
  astigmatism: { enabled: boolean; magnitude: number; axis: number };
  colorVision: { enabled: boolean; type: ColorVisionType; severity: number };
  cataract: {
    enabled: boolean;
    subtype: CataractSubtype;
    cloudiness: number;
    yellowing: number;
    brightnessLoss: number;
    glare: number;
  };
  glaucoma: { enabled: boolean; innerRadius: number; feather: number; severity: number };
  amd: { enabled: boolean; scotomaRadius: number; falloff: number; distortion: number };
  diabeticRetinopathy: { enabled: boolean; spotCount: number; spotSize: number; severity: number };
  retinitisPigmentosa: {
    enabled: boolean;
    tunnelRadius: number;
    feather: number;
    brightnessLoss: number;
  };
  floaters: { enabled: boolean; count: number; size: number; opacity: number; animate: boolean };
  migraineAura: {
    enabled: boolean;
    radius: number;
    positionX: number;
    positionY: number;
    animate: boolean;
  };
  // maskData is held in-memory as ImageData for fast WebGL upload; presets serialize it
  // separately to base64 PNG since ImageData is not JSON-friendly.
  customMask: {
    enabled: boolean;
    effect: MaskEffect;
    intensity: number;
    maskData: ImageData | null;
  };
}

export type ConditionKey = keyof EyeSettings;

export function createDefaultEyeSettings(): EyeSettings {
  return {
    myopia: { enabled: false, strength: 0 },
    hyperopia: { enabled: false, strength: 0 },
    presbyopia: { enabled: false, strength: 0 },
    astigmatism: { enabled: false, magnitude: 0, axis: 0 },
    colorVision: { enabled: false, type: 'normal', severity: 1 },
    cataract: {
      enabled: false,
      subtype: 'nuclear',
      cloudiness: 0,
      yellowing: 0,
      brightnessLoss: 0,
      glare: 0,
    },
    glaucoma: { enabled: false, innerRadius: 0.7, feather: 0.1, severity: 1 },
    amd: { enabled: false, scotomaRadius: 0, falloff: 0.1, distortion: 0 },
    diabeticRetinopathy: { enabled: false, spotCount: 0, spotSize: 0.05, severity: 0 },
    retinitisPigmentosa: {
      enabled: false,
      tunnelRadius: 0.3,
      feather: 0.05,
      brightnessLoss: 0.3,
    },
    floaters: { enabled: false, count: 0, size: 0.02, opacity: 0.5, animate: true },
    migraineAura: { enabled: false, radius: 0.15, positionX: 0.5, positionY: 0.5, animate: true },
    customMask: { enabled: false, effect: 'darken', intensity: 1, maskData: null },
  };
}
