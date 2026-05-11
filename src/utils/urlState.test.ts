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
});
