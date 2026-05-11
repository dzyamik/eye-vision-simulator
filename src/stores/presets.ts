// Named EyeSettings snapshots ("Mild myopia", "Wet AMD", ...). Built-in list
// is sourced from src/constants/builtInPresets.ts; user presets stay
// in-memory with manual export to JSON (no localStorage — see
// dev-docs/06-state-management.md §Persistence).
//
// JSON round-trip swaps customMask.maskData (ImageData, not JSON-friendly)
// for customMask.maskBase64 (PNG data URL). Import is async because PNG
// decode goes through a transient HTMLImageElement.

import { defineStore } from 'pinia';
import { markRaw, ref } from 'vue';

import { BUILT_IN_PRESETS } from '@/constants/builtInPresets';
import type {
  CataractSubtype,
  ColorVisionType,
  EyeSettings,
  MaskEffect,
} from '@/types/eyeSettings';
import { createDefaultEyeSettings } from '@/types/eyeSettings';
import { deepClone } from '@/utils/clone';

import { useEyeSettingsStore } from './eyeSettings';

export interface Preset {
  id: string;
  name: string;
  left: EyeSettings;
  right: EyeSettings;
  builtIn?: boolean;
}

const SCHEMA_VERSION = 1;

interface ExportedCustomMask {
  enabled: boolean;
  effect: MaskEffect;
  intensity: number;
  /** PNG data URL ("data:image/png;base64,…") or null if no mask painted. */
  maskBase64: string | null;
}

/** Same shape as EyeSettings but with customMask.maskData replaced by
 *  maskBase64. Used as the JSON wire format. */
type ExportedEyeSettings = Omit<EyeSettings, 'customMask'> & {
  customMask: ExportedCustomMask;
};

interface ExportedPayload {
  schemaVersion: number;
  exportedAt: string;
  left: ExportedEyeSettings;
  right: ExportedEyeSettings;
}

function imageDataToBase64Png(data: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = data.width;
  canvas.height = data.height;
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error('Cannot get 2d context for mask serialization');
  ctx.putImageData(data, 0, 0);
  return canvas.toDataURL('image/png');
}

async function base64PngToImageData(dataUrl: string): Promise<ImageData> {
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Mask PNG decode failed'));
    img.src = dataUrl;
  });
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error('Cannot get 2d context for mask decode');
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function exportEyeSettings(es: EyeSettings): ExportedEyeSettings {
  const cloned = deepClone(es);
  const maskBase64 =
    es.customMask.maskData !== null ? imageDataToBase64Png(es.customMask.maskData) : null;
  return {
    ...cloned,
    customMask: {
      enabled: cloned.customMask.enabled,
      effect: cloned.customMask.effect,
      intensity: cloned.customMask.intensity,
      maskBase64,
    },
  };
}

async function importEyeSettings(serialized: ExportedEyeSettings): Promise<EyeSettings> {
  // Start from defaults so any field the importer doesn't know about (e.g.
  // older exports missing a v1.1 field) falls back rather than crashing.
  const base = createDefaultEyeSettings();
  const restored: EyeSettings = {
    ...base,
    ...(serialized as unknown as EyeSettings),
    // Deep-merge a couple of structurally-typed fields so the spread above
    // doesn't replace nested defaults wholesale with potentially-stale
    // imported values.
    colorVision: {
      ...base.colorVision,
      ...serialized.colorVision,
      type: serialized.colorVision.type as ColorVisionType,
    },
    cataract: {
      ...base.cataract,
      ...serialized.cataract,
      subtype: serialized.cataract.subtype as CataractSubtype,
    },
    customMask: {
      enabled: serialized.customMask.enabled,
      effect: serialized.customMask.effect as MaskEffect,
      intensity: serialized.customMask.intensity,
      maskData:
        serialized.customMask.maskBase64 !== null
          ? markRaw(await base64PngToImageData(serialized.customMask.maskBase64))
          : null,
    },
  };
  return restored;
}

export const usePresetsStore = defineStore('presets', () => {
  // Use spread so the store's array is independent of the imported readonly
  // tuple — protects against accidental mutation via the store ref.
  const builtIn = ref<Preset[]>([...BUILT_IN_PRESETS]);
  const userPresets = ref<Preset[]>([]);

  function load(preset: Preset): void {
    const eye = useEyeSettingsStore();
    eye.left = deepClone(preset.left);
    eye.right = deepClone(preset.right);
  }

  function saveCurrent(name: string): Preset {
    const eye = useEyeSettingsStore();
    const preset: Preset = {
      id: `user-${Date.now()}`,
      name,
      left: deepClone(eye.left),
      right: deepClone(eye.right),
    };
    userPresets.value.push(preset);
    return preset;
  }

  function exportJson(): string {
    const eye = useEyeSettingsStore();
    const payload: ExportedPayload = {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      left: exportEyeSettings(eye.left),
      right: exportEyeSettings(eye.right),
    };
    return JSON.stringify(payload, null, 2);
  }

  async function importJson(text: string): Promise<void> {
    const payload = JSON.parse(text) as ExportedPayload;
    if (payload.schemaVersion !== SCHEMA_VERSION) {
      throw new Error(
        `Unsupported preset schema v${payload.schemaVersion}; this build expects v${SCHEMA_VERSION}`,
      );
    }
    const [left, right] = await Promise.all([
      importEyeSettings(payload.left),
      importEyeSettings(payload.right),
    ]);
    const eye = useEyeSettingsStore();
    eye.left = left;
    eye.right = right;
  }

  return { builtIn, userPresets, load, saveCurrent, exportJson, importJson };
});
