import { describe, expect, it } from 'vitest';

import {
  axisCategory,
  formatAstigmatism,
  formatRefractive,
  magnitudeToCylDiopters,
  strengthToAcuityPercent,
  strengthToDiopters,
} from './refractive';

describe('strengthToDiopters', () => {
  it('returns 0 D at slider zero', () => {
    expect(strengthToDiopters(0, 'myopia')).toBe(0);
    expect(strengthToDiopters(0, 'hyperopia')).toBe(0);
  });

  it('myopia is negative, hyperopia is positive', () => {
    expect(strengthToDiopters(0.5, 'myopia')).toBeLessThan(0);
    expect(strengthToDiopters(0.5, 'hyperopia')).toBeGreaterThan(0);
  });

  it('reaches ±6 D at slider 1.0 (per spec narrative "~-6 D and beyond")', () => {
    expect(strengthToDiopters(1, 'myopia')).toBe(-6);
    expect(strengthToDiopters(1, 'hyperopia')).toBe(6);
  });

  it('clamps inputs outside [0, 1]', () => {
    expect(strengthToDiopters(-0.5, 'myopia')).toBe(0);
    expect(strengthToDiopters(2, 'myopia')).toBe(-6);
  });

  it('is linear between endpoints', () => {
    expect(strengthToDiopters(0.5, 'myopia')).toBe(-3);
    expect(strengthToDiopters(0.25, 'hyperopia')).toBe(1.5);
  });
});

describe('strengthToAcuityPercent', () => {
  it('returns 100% at slider zero', () => {
    expect(strengthToAcuityPercent(0, 'myopia')).toBe(100);
    expect(strengthToAcuityPercent(0, 'hyperopia')).toBe(100);
  });

  it('drops monotonically with strength', () => {
    const a = strengthToAcuityPercent(0.25, 'myopia');
    const b = strengthToAcuityPercent(0.5, 'myopia');
    const c = strengthToAcuityPercent(1.0, 'myopia');
    expect(a).toBeGreaterThan(b);
    expect(b).toBeGreaterThan(c);
  });

  it('matches the standard Snellen formula (myopia, k=0.27)', () => {
    // At 6 D: 100 / (1 + 0.27 * 6) = 100 / 2.62 ≈ 38.17
    expect(strengthToAcuityPercent(1, 'myopia')).toBeCloseTo(38.17, 1);
  });

  it('matches the standard Snellen formula (hyperopia, k=0.23)', () => {
    // At 6 D: 100 / (1 + 0.23 * 6) = 100 / 2.38 ≈ 42.02
    expect(strengthToAcuityPercent(1, 'hyperopia')).toBeCloseTo(42.02, 1);
  });
});

describe('formatRefractive', () => {
  it('formats zero as "0.0 D · 100%" with no sign', () => {
    expect(formatRefractive(0, 'myopia')).toBe('0.0 D · 100%');
  });

  it('uses a typographic minus for myopia', () => {
    // The character is U+2212 MINUS SIGN, not the ASCII hyphen-minus.
    const out = formatRefractive(0.5, 'myopia');
    expect(out.startsWith('−')).toBe(true);
    expect(out).toMatch(/^−3\.0 D · 55%$/);
  });

  it('uses a plus for hyperopia', () => {
    const out = formatRefractive(0.5, 'hyperopia');
    expect(out.startsWith('+')).toBe(true);
    expect(out).toMatch(/^\+3\.0 D · 59%$/);
  });
});

describe('magnitudeToCylDiopters', () => {
  it('returns 0 D at slider zero', () => {
    expect(magnitudeToCylDiopters(0)).toBe(0);
  });

  it('reaches −3 D at slider 1.0 (boundary of severe/extreme)', () => {
    expect(magnitudeToCylDiopters(1)).toBe(-3);
  });

  it('clamps inputs outside [0, 1]', () => {
    expect(magnitudeToCylDiopters(-0.5)).toBe(0);
    expect(magnitudeToCylDiopters(2)).toBe(-3);
  });

  it('is linear between endpoints', () => {
    expect(magnitudeToCylDiopters(0.5)).toBe(-1.5);
    expect(magnitudeToCylDiopters(0.25)).toBe(-0.75);
  });
});

describe('axisCategory', () => {
  it('classifies WTR around 90°', () => {
    expect(axisCategory(60)).toBe('with-the-rule');
    expect(axisCategory(90)).toBe('with-the-rule');
    expect(axisCategory(120)).toBe('with-the-rule');
  });

  it('classifies ATR around 0/180°', () => {
    expect(axisCategory(0)).toBe('against-the-rule');
    expect(axisCategory(15)).toBe('against-the-rule');
    expect(axisCategory(30)).toBe('against-the-rule');
    expect(axisCategory(150)).toBe('against-the-rule');
    expect(axisCategory(180)).toBe('against-the-rule');
  });

  it('classifies oblique between the boundaries', () => {
    expect(axisCategory(45)).toBe('oblique');
    expect(axisCategory(135)).toBe('oblique');
  });

  it('normalises out-of-range axes', () => {
    // 270° wraps to 90° (axis is direction-agnostic mod 180).
    expect(axisCategory(270)).toBe('with-the-rule');
    expect(axisCategory(-90)).toBe('with-the-rule');
  });
});

describe('formatAstigmatism', () => {
  it('formats zero magnitude without category, axis still shown', () => {
    expect(formatAstigmatism(0, 90)).toBe('0.0 D × 90°');
  });

  it('includes typographic minus, axis, and category', () => {
    const out = formatAstigmatism(0.5, 90);
    expect(out.startsWith('−')).toBe(true);
    expect(out).toBe('−1.5 D × 90° · with-the-rule');
  });

  it('classifies oblique angles correctly', () => {
    expect(formatAstigmatism(1, 45)).toBe('−3.0 D × 45° · oblique');
  });

  it('classifies horizontal angles as ATR', () => {
    expect(formatAstigmatism(0.25, 0)).toBe('−0.8 D × 0° · against-the-rule');
  });
});
