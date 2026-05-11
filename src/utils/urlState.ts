// Pure encode/decode helpers for the URL state blob. See
// dev-docs/11-url-state.md for the schema. The actual store wiring +
// debounced history.replaceState lives in src/composables/useUrlSync.ts
// (Phase 10.2); this file is dependency-free so it's trivially testable.

import type { ViewMode } from '@/stores/viewSettings';
import type { EyeSettings } from '@/types/eyeSettings';

export const URL_STATE_VERSION = 1;
export const URL_STATE_PARAM = 's';

/** EyeSettings minus customMask.maskData (the typed-array we can't fit in
 *  a URL). The rest of the customMask config travels normally. */
export type EyeSettingsForUrl = Omit<EyeSettings, 'customMask'> & {
  customMask: Omit<EyeSettings['customMask'], 'maskData'>;
};

export interface UrlState {
  v: number;
  vm: ViewMode;
  sync: boolean;
  sample?: string;
  l: EyeSettingsForUrl;
  r: EyeSettingsForUrl;
}

/** Strip maskData off an EyeSettings — both directions of the URL pipeline
 *  use this, so it's exported. */
export function eyeSettingsForUrl(es: EyeSettings): EyeSettingsForUrl {
  // Deliberately structural — this isn't a perf-critical path and a
  // shallow rebuild stays readable as fields evolve.
  return {
    ...es,
    customMask: {
      enabled: es.customMask.enabled,
      effect: es.customMask.effect,
      intensity: es.customMask.intensity,
    },
  };
}

/** Encode a UrlState as a base64url string. UTF-8 safe via TextEncoder. */
export function encode(state: UrlState): string {
  const json = JSON.stringify(state);
  const bytes = new TextEncoder().encode(json);
  // Build a binary string from the bytes, then btoa. Doing it in chunks
  // would matter for huge inputs but our worst case is ~2 KB.
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Decode a base64url string into a UrlState. Throws on malformed input or
 *  on a version we don't know how to migrate. */
export function decode(blob: string): UrlState {
  const padded = blob.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (padded.length % 4)) % 4;
  const bin = atob(padded + '='.repeat(padding));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const json = new TextDecoder().decode(bytes);
  const parsed = JSON.parse(json) as UrlState;
  if (parsed.v > URL_STATE_VERSION) {
    throw new Error(
      `URL state version ${parsed.v} is newer than this build's v${URL_STATE_VERSION}; refresh the page or update.`,
    );
  }
  // Future: if (parsed.v < URL_STATE_VERSION) walk migrations up to current.
  return parsed;
}
