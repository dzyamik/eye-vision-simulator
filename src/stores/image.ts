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
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

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

  return { current, sampleImages, setFromFile, setFromSample };
});
