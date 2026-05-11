import { describe, expect, it } from 'vitest';

import {
  formatRefractive,
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
