// Round-trip tests for the URL-state codec. Pure helper, no Pinia / DOM
// needed — runs in the default node Vitest environment.

import { describe, expect, it } from 'vitest';

import { createDefaultEyeSettings } from '@/types/eyeSettings';

import {
  decode,
  encode,
  eyeSettingsForUrl,
  URL_STATE_VERSION,
  type UrlState,
} from './urlState';

function sampleState(): UrlState {
  const left = createDefaultEyeSettings();
  left.myopia.enabled = true;
  left.myopia.strength = 0.42;
  left.colorVision.enabled = true;
  left.colorVision.type = 'deuteranomaly';
  left.colorVision.severity = 0.7;

  const right = createDefaultEyeSettings();
  right.cataract.enabled = true;
  right.cataract.subtype = 'cortical';
  right.cataract.cloudiness = 0.6;

  return {
    v: URL_STATE_VERSION,
    vm: 'split',
    sync: false,
    sample: 'crosswalk.jpg',
    l: eyeSettingsForUrl(left),
    r: eyeSettingsForUrl(right),
  };
}

describe('urlState codec', () => {
  it('round-trips a representative state without loss', () => {
    const original = sampleState();
    const encoded = encode(original);
    const decoded = decode(encoded);
    expect(decoded).toEqual(original);
  });

  it('produces a base64url string (no +, /, or = characters)', () => {
    const encoded = encode(sampleState());
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it('handles unicode payloads (e.g. preset names with non-ASCII)', () => {
    const state = sampleState();
    state.sample = 'тест-image.jpg'; // Cyrillic; sample names are ASCII in practice but the encoder must not assume.
    const decoded = decode(encode(state));
    expect(decoded.sample).toBe('тест-image.jpg');
  });

  it('throws when decoding a future version', () => {
    const future: UrlState = {
      ...sampleState(),
      v: URL_STATE_VERSION + 99,
    };
    const blob = encode(future);
    expect(() => decode(blob)).toThrow(/newer than this build/);
  });

  it('throws on malformed base64', () => {
    expect(() => decode('not~~valid~~base64')).toThrow();
  });

  it('eyeSettingsForUrl strips maskData but keeps the rest of customMask', () => {
    const es = createDefaultEyeSettings();
    es.customMask.enabled = true;
    es.customMask.intensity = 0.8;
    es.customMask.effect = 'darken';
    // maskData would be a real ImageData in the live store; null is fine
    // for this unit test.
    const stripped = eyeSettingsForUrl(es);
    expect(stripped.customMask).toEqual({
      enabled: true,
      intensity: 0.8,
      effect: 'darken',
    });
    expect('maskData' in stripped.customMask).toBe(false);
  });

  it('round-trips every numeric and enum field across both eyes (10.4)', () => {
    // Every condition has at least one non-default value on each side, so a
    // missed field anywhere shows up as a deepEqual mismatch.
    const left = createDefaultEyeSettings();
    left.myopia = { enabled: true, strength: 0.31 };
    left.hyperopia = { enabled: true, strength: 0.27 };
    left.presbyopia = { enabled: true, strength: 0.19 };
    left.astigmatism = { enabled: true, magnitude: 0.55, axis: 137 };
    left.colorVision = { enabled: true, type: 'protanopia', severity: 0.83 };
    left.cataract = {
      enabled: true,
      subtype: 'subcapsular',
      cloudiness: 0.42,
      yellowing: 0.17,
      brightnessLoss: 0.51,
      glare: 0.91,
    };
    left.glaucoma = { enabled: true, innerRadius: 0.46, feather: 0.18, severity: 0.66 };
    left.amd = { enabled: true, scotomaRadius: 0.22, falloff: 0.09, distortion: 0.74 };
    left.diabeticRetinopathy = { enabled: true, spotCount: 13, spotSize: 0.07, severity: 0.49 };
    left.retinitisPigmentosa = {
      enabled: true,
      tunnelRadius: 0.21,
      feather: 0.12,
      brightnessLoss: 0.58,
    };
    left.floaters = { enabled: true, count: 9, size: 0.034, opacity: 0.61, animate: false };
    left.migraineAura = {
      enabled: true,
      radius: 0.23,
      positionX: 0.32,
      positionY: 0.71,
      animate: true,
    };
    left.customMask = {
      enabled: true,
      effect: 'desaturate',
      intensity: 0.78,
      maskData: null,
    };

    const right = createDefaultEyeSettings();
    right.myopia = { enabled: false, strength: 0.05 };
    right.colorVision = { enabled: true, type: 'tritanomaly', severity: 0.41 };
    right.cataract.subtype = 'nuclear';
    right.glaucoma.innerRadius = 0.6;
    right.amd.distortion = 0.33;
    right.diabeticRetinopathy.spotCount = 27;
    right.floaters.animate = true;
    right.migraineAura.positionX = 0.88;
    right.customMask.effect = 'blur';

    const original: UrlState = {
      v: URL_STATE_VERSION,
      vm: 'right',
      sync: true,
      sample: 'nordic-house.jpg',
      l: eyeSettingsForUrl(left),
      r: eyeSettingsForUrl(right),
    };
    expect(decode(encode(original))).toEqual(original);
  });

  it("decodes a same-version blob that's missing optional fields without throwing (10.4)", () => {
    // Future spec might add fields; old URLs should still parse. Codec just
    // returns the parsed JSON as-is — restoreEyeSettings in useUrlSync is
    // the layer that fills defaults for missing keys, but the codec mustn't
    // refuse the input. Simulate by hand-crafting a stripped JSON.
    const minimal = {
      v: URL_STATE_VERSION,
      vm: 'both' as const,
      sync: false,
      // Only myopia provided per side; everything else is absent. In the
      // live app, restoreEyeSettings would spread these over
      // createDefaultEyeSettings() to fill the rest.
      l: { myopia: { enabled: true, strength: 0.4 } },
      r: { myopia: { enabled: false, strength: 0 } },
    };
    const json = JSON.stringify(minimal);
    const bytes = new TextEncoder().encode(json);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
    const blob = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    expect(() => decode(blob)).not.toThrow();
    const decoded = decode(blob);
    expect(decoded.v).toBe(URL_STATE_VERSION);
    expect(decoded.vm).toBe('both');
    expect((decoded.l as { myopia: { strength: number } }).myopia.strength).toBe(0.4);
  });
});
