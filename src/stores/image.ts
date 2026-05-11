// Holds the image being inspected (data URL or public path) and the bundled
// sample list. Uploaded files stay client-side as data URLs; we never POST.

import { defineStore } from 'pinia';
import { ref } from 'vue';

import { getImageDims, readAsDataURL } from '@/utils/image';

export interface ImageSource {
  src: string;
  width: number;
  height: number;
  filename?: string;
  /** Human-friendly label for sample images. Falls back to filename when absent. */
  name?: string;
}

interface SampleManifestEntry {
  filename: string;
  width: number;
  height: number;
  name?: string;
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const SAMPLES_BASE = `${import.meta.env.BASE_URL}samples/`;
const MANIFEST_URL = `${SAMPLES_BASE}index.json`;

export const useImageStore = defineStore('image', () => {
  const current = ref<ImageSource | null>(null);
  const sampleImages = ref<ImageSource[]>([]);

  async function setFromFile(file: File): Promise<void> {
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error('File too large (10 MB max)');
    }
    const src = await readAsDataURL(file);
    const { width, height } = await getImageDims(src);
    current.value = { src, width, height, filename: file.name };
  }

  function setFromSample(s: ImageSource): void {
    current.value = s;
  }

  // Fetched once at app start (App.vue's onMounted). Loads the manifest
  // only — it does NOT touch `current`, so the caller can apply URL state
  // first and fall back to the default via `ensureDefaultImage()` only if
  // nothing was selected. The old behaviour (setting default inside this
  // function) caused two writes to `current` when a URL state was present,
  // racing two Phaser texture loads against each other.
  async function loadSampleManifest(): Promise<void> {
    const res = await fetch(MANIFEST_URL);
    if (!res.ok) {
      throw new Error(`Sample manifest fetch failed (${res.status})`);
    }
    const entries = (await res.json()) as SampleManifestEntry[];
    sampleImages.value = entries.map((e) => ({
      src: SAMPLES_BASE + e.filename,
      width: e.width,
      height: e.height,
      filename: e.filename,
      name: e.name,
    }));
  }

  /** Picks the first bundled sample as the default if no image has been
   *  chosen yet — so the user never lands on an empty viewer. Idempotent;
   *  safe to call repeatedly. */
  function ensureDefaultImage(): void {
    if (current.value === null && sampleImages.value.length > 0) {
      current.value = sampleImages.value[0]!;
    }
  }

  return {
    current,
    sampleImages,
    setFromFile,
    setFromSample,
    loadSampleManifest,
    ensureDefaultImage,
  };
});
