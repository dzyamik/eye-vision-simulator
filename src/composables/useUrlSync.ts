// Two-way bridge between the Pinia stores and window.location.search:
//
//   read  ← applyFromCurrentUrl() parses ?s=<base64url>, decodes via the
//          urlState helpers, applies to the three stores. Called once at
//          app start (App.vue onMounted, after the sample manifest has
//          loaded so sample-by-filename lookup works).
//
//   write ← a deep watcher on the relevant store fields debounces 300 ms
//          then encodes a fresh snapshot and pushes it via
//          history.replaceState. NOT pushState — slider drags shouldn't
//          accumulate one history entry per tick. Skips the write if the
//          encoded blob equals the last one we wrote, so a no-op store
//          mutation doesn't even touch history.
//
// Mask data is intentionally not in the URL (see dev-docs/11-url-state.md).
// On apply, we preserve whatever maskData the live store currently holds —
// pasting a URL shouldn't wipe a user's in-progress painted scotoma.

import { watch } from 'vue';

import { useEyeSettingsStore } from '@/stores/eyeSettings';
import { useImageStore } from '@/stores/image';
import { useToastStore } from '@/stores/toast';
import { useViewSettingsStore } from '@/stores/viewSettings';
import type { EyeSettings } from '@/types/eyeSettings';
import { createDefaultEyeSettings } from '@/types/eyeSettings';
import {
  decode,
  encode,
  eyeSettingsForUrl,
  URL_STATE_PARAM,
  URL_STATE_VERSION,
  type EyeSettingsForUrl,
  type UrlState,
} from '@/utils/urlState';

const DEBOUNCE_MS = 300;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastWrittenBlob: string | null = null;
let isApplying = false;

function isSampleSrc(src: string | undefined): boolean {
  // Anything not a data URL is treated as a sample (the public/samples
  // path or a future remote URL). data:* URLs come from setFromFile and
  // can't be carried in a query string.
  return src !== undefined && !src.startsWith('data:');
}

function snapshot(): UrlState {
  const eye = useEyeSettingsStore();
  const view = useViewSettingsStore();
  const image = useImageStore();
  const sample =
    image.current !== null && isSampleSrc(image.current.src)
      ? image.current.filename
      : undefined;
  return {
    v: URL_STATE_VERSION,
    vm: view.viewMode,
    sync: eye.linked,
    sample,
    l: eyeSettingsForUrl(eye.left),
    r: eyeSettingsForUrl(eye.right),
  };
}

function restoreEyeSettings(
  forUrl: EyeSettingsForUrl,
  current: EyeSettings,
): EyeSettings {
  const base = createDefaultEyeSettings();
  // Spread base first so any future field that the URL doesn't carry has a
  // sensible default. Then the URL's fields. Then patch customMask to
  // re-attach the live maskData (URL doesn't carry it).
  return {
    ...base,
    ...(forUrl as unknown as EyeSettings),
    customMask: {
      ...base.customMask,
      ...forUrl.customMask,
      maskData: current.customMask.maskData,
    },
  };
}

function applyState(state: UrlState): void {
  isApplying = true;
  try {
    const eye = useEyeSettingsStore();
    const view = useViewSettingsStore();
    const image = useImageStore();
    eye.left = restoreEyeSettings(state.l, eye.left);
    eye.right = restoreEyeSettings(state.r, eye.right);
    eye.linked = state.sync;
    view.viewMode = state.vm;
    if (state.sample !== undefined) {
      const match = image.sampleImages.find((s) => s.filename === state.sample);
      if (match !== undefined) image.setFromSample(match);
      // If no match, leave image.current alone — better than blanking the
      // viewer because the user has a different build of the app.
    }
  } finally {
    isApplying = false;
  }
}

/** Parses ?s=<…> from window.location.search and applies it. Returns true
 *  if a valid blob was found and applied. Errors are reported via toast. */
function applyFromCurrentUrl(): boolean {
  const params = new URLSearchParams(window.location.search);
  const blob = params.get(URL_STATE_PARAM);
  if (blob === null) return false;
  try {
    applyState(decode(blob));
    lastWrittenBlob = blob;
    return true;
  } catch (err) {
    const toast = useToastStore();
    toast.push(`URL state failed to load: ${(err as Error).message}`, { type: 'error' });
    return false;
  }
}

function scheduleWrite(): void {
  if (isApplying) return;
  if (debounceTimer !== null) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    const blob = encode(snapshot());
    if (blob === lastWrittenBlob) return;
    lastWrittenBlob = blob;
    const params = new URLSearchParams(window.location.search);
    params.set(URL_STATE_PARAM, blob);
    const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    window.history.replaceState(null, '', newUrl);
  }, DEBOUNCE_MS);
}

interface UrlSyncHandle {
  applyFromCurrentUrl(): boolean;
}

let initialised = false;

export function useUrlSync(): UrlSyncHandle {
  if (!initialised) {
    initialised = true;
    const eye = useEyeSettingsStore();
    const view = useViewSettingsStore();
    const image = useImageStore();
    watch(
      () => [
        eye.left,
        eye.right,
        eye.linked,
        view.viewMode,
        image.current?.src ?? null,
      ],
      scheduleWrite,
      { deep: true, flush: 'post' },
    );
  }
  return { applyFromCurrentUrl };
}
