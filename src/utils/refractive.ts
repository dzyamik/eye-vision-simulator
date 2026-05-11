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
