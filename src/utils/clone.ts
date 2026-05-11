// Vue 3 wraps state passed to `ref()` / `reactive()` in deep Proxies. Native
// `structuredClone` refuses those (DataCloneError) because Proxies don't
// expose the internal slots structuredClone walks. This helper unwraps the
// proxies first (via `toRaw` at every level) and then structuredClones the
// plain result — so payloads like ImageData / TypedArrays still get the
// correct deep-copy semantics.

import { toRaw } from 'vue';

function unwrap(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  // Pass binary / DOM payloads straight through; structuredClone handles them.
  // ImageData is a DOM type, so guard with typeof so Node-side tests don't blow up.
  if (typeof ImageData !== 'undefined' && value instanceof ImageData) return value;
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) return value;

  const raw = toRaw(value) as Record<string, unknown>;
  if (Array.isArray(raw)) return raw.map(unwrap);
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(raw)) {
    out[k] = unwrap(raw[k]);
  }
  return out;
}

export function deepClone<T>(value: T): T {
  return structuredClone(unwrap(value)) as T;
}
