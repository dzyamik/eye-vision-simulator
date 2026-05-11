// Six built-in presets shipped with v1, exactly the list in
// dev-docs/05-ui-ux-design.md §Presets. Each preset starts from
// createDefaultEyeSettings() per eye and overrides specific fields so the
// preset's intent is self-evident at the call site.
//
// User-saved presets aren't here — they live in usePresetsStore.userPresets
// (in-memory) and round-trip through 9.2's JSON export/import.

import type { Preset } from '@/stores/presets';
import type { EyeSettings } from '@/types/eyeSettings';
import { createDefaultEyeSettings } from '@/types/eyeSettings';

function defaults(): { left: EyeSettings; right: EyeSettings } {
  return {
    left: createDefaultEyeSettings(),
    right: createDefaultEyeSettings(),
  };
}

function mildMyopia(): Preset {
  const { left, right } = defaults();
  left.myopia = { enabled: true, strength: 0.3 };
  right.myopia = { enabled: true, strength: 0.3 };
  return {
    id: 'mild-myopia',
    name: 'Mild myopia (both eyes)',
    left,
    right,
    builtIn: true,
  };
}

function moderateCataractRight(): Preset {
  const { left, right } = defaults();
  right.cataract = {
    enabled: true,
    subtype: 'nuclear',
    cloudiness: 0.3,
    yellowing: 0.7,
    brightnessLoss: 0.4,
    glare: 0.1,
  };
  return {
    id: 'moderate-cataract-right',
    name: 'Moderate cataract (right eye only)',
    left,
    right,
    builtIn: true,
  };
}

function deuteranomaly(): Preset {
  const { left, right } = defaults();
  left.colorVision = { enabled: true, type: 'deuteranomaly', severity: 1 };
  right.colorVision = { enabled: true, type: 'deuteranomaly', severity: 1 };
  return {
    id: 'deuteranomaly',
    name: 'Deuteranomaly',
    left,
    right,
    builtIn: true,
  };
}

function advancedGlaucoma(): Preset {
  const { left, right } = defaults();
  // Tight inner radius (smaller preserved area) + max darkness at the
  // periphery — what users picture when they hear "advanced glaucoma".
  left.glaucoma = { enabled: true, innerRadius: 0.35, feather: 0.1, severity: 1 };
  right.glaucoma = { enabled: true, innerRadius: 0.35, feather: 0.1, severity: 1 };
  return {
    id: 'advanced-glaucoma',
    name: 'Advanced glaucoma (peripheral loss)',
    left,
    right,
    builtIn: true,
  };
}

function wetAmd(): Preset {
  const { left, right } = defaults();
  // Central scotoma + visible metamorphopsia. The wet variant of AMD is
  // distinguished by the metamorphopsia (warped straight lines) — we
  // crank distortion to make that pop.
  left.amd = { enabled: true, scotomaRadius: 0.15, falloff: 0.05, distortion: 0.6 };
  right.amd = { enabled: true, scotomaRadius: 0.15, falloff: 0.05, distortion: 0.6 };
  return {
    id: 'wet-amd',
    name: 'Wet AMD (central scotoma)',
    left,
    right,
    builtIn: true,
  };
}

function mildCataractAndPresbyopia(): Preset {
  const { left, right } = defaults();
  // Subtype 'nuclear' but at gentler values than the moderate preset.
  const mildCat = {
    enabled: true,
    subtype: 'nuclear' as const,
    cloudiness: 0.2,
    yellowing: 0.4,
    brightnessLoss: 0.2,
    glare: 0.05,
  };
  left.cataract = { ...mildCat };
  right.cataract = { ...mildCat };
  left.presbyopia = { enabled: true, strength: 0.3 };
  right.presbyopia = { enabled: true, strength: 0.3 };
  return {
    id: 'mild-cataract-presbyopia',
    name: 'Mixed: mild cataract + presbyopia',
    left,
    right,
    builtIn: true,
  };
}

export const BUILT_IN_PRESETS: readonly Preset[] = [
  mildMyopia(),
  moderateCataractRight(),
  deuteranomaly(),
  advancedGlaucoma(),
  wetAmd(),
  mildCataractAndPresbyopia(),
];
