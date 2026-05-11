// Helpers that translate the simulator's `strength` slider (0..1) into the
// units a clinician or optician would actually use:
//
//   - Dioptres (D): optical power of the corrective lens. Negative for
//     myopia (concave), positive for hyperopia (convex). Per
//     dev-docs/03-eye-conditions.md, slider `strength = 1.0` represents
//     "~−6 D and beyond" for myopia, so we map linearly to ±6 D.
//
//   - Uncorrected visual acuity, expressed as a percentage where 20/20
//     vision = 100%. Approximated via the standard quick-conversion
//     formula:  20/20-equivalent = 20 / (1 + k × |D|)  →
//                          %     = 100 / (1 + k × |D|)
//     k = 0.27 for myopia, 0.23 for hyperopia. From clinical
//     calculators (Manlykicks, cdcalculators); aligns with the
//     "0.5 D ≈ 1 Snellen line" rule used in optometry literature.
//
// These are approximations — real uncorrected acuity also depends on
// pupil size, higher-order aberrations, contrast, and age. They're meant
// to give the user a clinically-meaningful anchor next to the abstract
// 0..1 slider, not a diagnostic measurement.

export type RefractiveType = 'myopia' | 'hyperopia';

const MAX_DIOPTERS = 6;
const SNELLEN_K: Record<RefractiveType, number> = {
  myopia: 0.27,
  hyperopia: 0.23,
};

export function strengthToDiopters(strength: number, type: RefractiveType): number {
  const magnitude = Math.max(0, Math.min(1, strength)) * MAX_DIOPTERS;
  // `0 * -1` is `-0` in JS — normalize so callers / tests don't trip on
  // signed-zero. `+ 0` flips -0 to +0 cheaply.
  return (type === 'myopia' ? -magnitude : magnitude) + 0;
}

export function strengthToAcuityPercent(strength: number, type: RefractiveType): number {
  const absD = Math.abs(strengthToDiopters(strength, type));
  return 100 / (1 + SNELLEN_K[type] * absD);
}

/** "−2.4 D · 55%" / "+1.8 D · 71%" / "0.0 D · 100%" — one short line for
 *  display under the slider. Uses the typographic minus sign (−) for
 *  negative dioptres so it reads as a sign, not a hyphen. */
export function formatRefractive(strength: number, type: RefractiveType): string {
  const d = strengthToDiopters(strength, type);
  const pct = strengthToAcuityPercent(strength, type);
  const sign = d > 0 ? '+' : d < 0 ? '−' : '';
  const dStr = `${sign}${Math.abs(d).toFixed(1)} D`;
  return `${dStr} · ${Math.round(pct)}%`;
}

// --- Astigmatism --------------------------------------------------------
//
// The cylinder (CYL) value on a real prescription is in dioptres. Clinical
// values are commonly −0.25 to −4.00 D; we map the simulator's `magnitude`
// slider (0..1) to 0 .. −3 D, which spans Mild / Moderate / Severe per
// the standard severity scale (Mild < 1 D, Moderate 1–2 D, Severe 2–3 D,
// Extreme > 3 D). Sign is always negative — the minus-cyl convention used
// in US optometry. Source: Insight Vision Center & 1-800 Contacts severity
// scales; AAO basic-optics chapter on astigmatic refractive error.
//
// The `axis` slider is already in degrees (0..180) using the TABO
// convention (3 o'clock = 0°, anticlockwise, 90° = vertical meridian).
// We bucket the axis into the three traditional categories optometrists
// use to describe orientation:
//
//   - With-the-rule (WTR): steepest meridian vertical (axis 60°–120°).
//     Most common in young adults.
//   - Against-the-rule (ATR): steepest meridian horizontal
//     (axis 0°–30° or 150°–180°). More common with age.
//   - Oblique: in between (axis 30°–60° or 120°–150°).
//
// Source: Wikipedia "Astigmatism", StatPearls/NIH.

const MAX_CYL_DIOPTERS = 3;

export type AxisCategory = 'with-the-rule' | 'against-the-rule' | 'oblique';

export function magnitudeToCylDiopters(magnitude: number): number {
  const m = Math.max(0, Math.min(1, magnitude)) * MAX_CYL_DIOPTERS;
  // Negative for minus-cyl convention. `+ 0` normalises -0 → +0 at zero.
  return -m + 0;
}

export function axisCategory(axisDeg: number): AxisCategory {
  // Normalise to [0, 180): astigmatism axes are direction-agnostic.
  const a = ((axisDeg % 180) + 180) % 180;
  if (a >= 60 && a <= 120) return 'with-the-rule';
  if (a <= 30 || a >= 150) return 'against-the-rule';
  return 'oblique';
}

/** "−1.5 D × 90° · with-the-rule" — one short line for display under
 *  the magnitude + axis controls. Uses × per prescription notation
 *  (e.g. "−1.50 × 090") and a typographic minus for the cylinder. */
export function formatAstigmatism(magnitude: number, axisDeg: number): string {
  const d = magnitudeToCylDiopters(magnitude);
  // Round axis to whole degrees for display; the dial is integer-stepped
  // anyway, but defend against accidental fractional inputs.
  const axis = Math.round(((axisDeg % 180) + 180) % 180);
  if (d === 0) {
    return `0.0 D × ${axis}°`;
  }
  const dStr = `−${Math.abs(d).toFixed(1)} D`;
  return `${dStr} × ${axis}° · ${axisCategory(axis)}`;
}
