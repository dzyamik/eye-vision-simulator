# 06 — State Management (Pinia)

Pinia is the single source of truth. Every parameter the user can change is in a store. Phaser pipelines react to store changes; they never own state.

## Canonical types

```ts
// src/types/eyeSettings.ts

export type ColorVisionType =
  | 'normal'
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia'
  | 'protanomaly'
  | 'deuteranomaly'
  | 'tritanomaly'
  | 'achromatopsia';

export type CataractSubtype = 'nuclear' | 'cortical' | 'subcapsular';
export type MaskEffect = 'darken' | 'blur' | 'desaturate';

export interface EyeSettings {
  myopia: { enabled: boolean; strength: number }; // strength 0..1
  hyperopia: { enabled: boolean; strength: number };
  presbyopia: { enabled: boolean; strength: number };
  astigmatism: { enabled: boolean; magnitude: number; axis: number }; // axis 0..180
  colorVision: { enabled: boolean; type: ColorVisionType; severity: number };
  cataract: {
    enabled: boolean;
    subtype: CataractSubtype;
    cloudiness: number;
    yellowing: number;
    brightnessLoss: number;
    glare: number;
  };
  glaucoma: { enabled: boolean; innerRadius: number; feather: number; severity: number };
  amd: { enabled: boolean; scotomaRadius: number; falloff: number; distortion: number };
  diabeticRetinopathy: { enabled: boolean; spotCount: number; spotSize: number; severity: number };
  retinitisPigmentosa: {
    enabled: boolean;
    tunnelRadius: number;
    feather: number;
    brightnessLoss: number;
  };
  floaters: { enabled: boolean; count: number; size: number; opacity: number; animate: boolean };
  migraineAura: {
    enabled: boolean;
    radius: number;
    positionX: number;
    positionY: number;
    animate: boolean;
  };
  customMask: {
    enabled: boolean;
    effect: MaskEffect;
    intensity: number;
    maskData: ImageData | null;
  };
}

export type ConditionKey = keyof EyeSettings;
```

A factory returns clean defaults:

```ts
// src/types/eyeSettings.ts (cont'd)
export function createDefaultEyeSettings(): EyeSettings {
  return {
    myopia: { enabled: false, strength: 0 },
    hyperopia: { enabled: false, strength: 0 },
    presbyopia: { enabled: false, strength: 0 },
    astigmatism: { enabled: false, magnitude: 0, axis: 0 },
    colorVision: { enabled: false, type: 'normal', severity: 1 },
    cataract: {
      enabled: false,
      subtype: 'nuclear',
      cloudiness: 0,
      yellowing: 0,
      brightnessLoss: 0,
      glare: 0,
    },
    glaucoma: { enabled: false, innerRadius: 0.7, feather: 0.1, severity: 1 },
    amd: { enabled: false, scotomaRadius: 0, falloff: 0.1, distortion: 0 },
    diabeticRetinopathy: { enabled: false, spotCount: 0, spotSize: 0.05, severity: 0 },
    retinitisPigmentosa: { enabled: false, tunnelRadius: 0.3, feather: 0.05, brightnessLoss: 0.3 },
    floaters: { enabled: false, count: 0, size: 0.02, opacity: 0.5, animate: true },
    migraineAura: { enabled: false, radius: 0.15, positionX: 0.5, positionY: 0.5, animate: true },
    customMask: { enabled: false, effect: 'darken', intensity: 1, maskData: null },
  };
}
```

> **Note on `ImageData`.** It's not directly serializable for export. The `presets.ts` store serializes the mask separately as a base64 PNG when saving; on load it reconstructs the `ImageData`. This keeps the in-memory store reactive without forcing JSON gymnastics.

## Stores

### `useEyeSettingsStore` — `src/stores/eyeSettings.ts`

```ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { EyeSettings, ConditionKey } from '@/types/eyeSettings';
import { createDefaultEyeSettings } from '@/types/eyeSettings';
import { deepClone } from '@/utils/clone';

export const useEyeSettingsStore = defineStore('eyeSettings', () => {
  const left = ref<EyeSettings>(createDefaultEyeSettings());
  const right = ref<EyeSettings>(createDefaultEyeSettings());
  const linked = ref<boolean>(false); // when true, edits apply to both

  function resetEye(eye: 'left' | 'right') {
    (eye === 'left' ? left : right).value = createDefaultEyeSettings();
  }
  function resetAll() {
    left.value = createDefaultEyeSettings();
    right.value = createDefaultEyeSettings();
    linked.value = false; // sync flag is part of "all"
  }
  function copy(from: 'left' | 'right', to: 'left' | 'right') {
    if (from === to) return;
    // deepClone unwraps Vue's reactive proxies before structuredClone
    // (which throws DataCloneError on Proxies). See src/utils/clone.ts.
    const src = (from === 'left' ? left : right).value;
    (to === 'left' ? left : right).value = deepClone(src);
  }

  const anyEnabled = computed(() => (eye: 'left' | 'right') => {
    const s = eye === 'left' ? left.value : right.value;
    return Object.values(s).some((c) => (c as { enabled: boolean }).enabled);
  });

  return { left, right, linked, resetEye, resetAll, copy, anyEnabled };
});
```

> **Why `deepClone` instead of `structuredClone` directly?** Pinia setup
> stores wrap state in deeply-reactive Vue Proxies. `structuredClone` walks
> the object via internal slots that Proxies don't forward, throwing
> `DataCloneError`. Our `src/utils/clone.ts` uses `toRaw` to unwrap proxies
> at every level, then delegates to `structuredClone` so binary payloads
> (e.g. `ImageData` in `customMask.maskData`) are still copied correctly.

**Why a setup-style store?** Better ref inference with TS, and the per-eye structure plays nicely with `watch()` from the bridge.

### `useViewSettingsStore` — `src/stores/viewSettings.ts`

```ts
export type ActiveEye = 'left' | 'right' | 'both';
export type ViewMode = 'both' | 'left' | 'right' | 'split';

export const useViewSettingsStore = defineStore('viewSettings', () => {
  const activeEye = ref<ActiveEye>('both'); // what the sidebar is editing
  const viewMode = ref<ViewMode>('both'); // what the impaired view renders
  return { activeEye, viewMode };
});
```

`activeEye` and `viewMode` are independent on purpose — a user can edit left eye while looking at both eyes blended, for example.

### `useImageStore` — `src/stores/image.ts`

```ts
export interface ImageSource {
  src: string; // data URL or public path
  width: number;
  height: number;
  filename?: string;
}

export const useImageStore = defineStore('image', () => {
  const current = ref<ImageSource | null>(null);
  const sampleImages = ref<ImageSource[]>([]); // loaded from public/samples manifest

  async function setFromFile(file: File) {
    if (file.size > 10 * 1024 * 1024) throw new Error('File too large (10 MB max)');
    const src = await readAsDataURL(file);
    const { width, height } = await getImageDims(src);
    current.value = { src, width, height, filename: file.name };
  }

  function setFromSample(s: ImageSource) {
    current.value = s;
  }

  return { current, sampleImages, setFromFile, setFromSample };
});
```

Helpers (`readAsDataURL`, `getImageDims`) live in `src/utils/image.ts`.

### `usePresetsStore` — `src/stores/presets.ts`

```ts
export interface Preset {
  id: string;
  name: string;
  left: EyeSettings; // with mask serialized as base64 PNG inside maskData
  right: EyeSettings;
  builtIn?: boolean;
}

export const usePresetsStore = defineStore('presets', () => {
  const builtIn = ref<Preset[]>([]); // populated at startup from a static list
  const userPresets = ref<Preset[]>([]); // in-memory only; user can export to JSON

  function load(preset: Preset) {
    const eye = useEyeSettingsStore();
    eye.left = deepClone(preset.left);
    eye.right = deepClone(preset.right);
  }
  function saveCurrent(name: string): Preset {
    /* ... */
  }
  function exportJson(): string {
    /* ... */
  }
  function importJson(text: string): void {
    /* ... */
  }

  return { builtIn, userPresets, load, saveCurrent, exportJson, importJson };
});
```

Mask serialization for export: when saving, walk each eye's `customMask.maskData`, convert via an offscreen canvas to a base64 PNG, and replace the field with a string. On import, reverse.

## Reactivity rules

- **Sliders** bind via `v-model` to a writable computed wrapping the store field, with clamping in the setter:

```ts
const strength = computed<number>({
  get: () => store.left.myopia.strength,
  set: (v) => (store.left.myopia.strength = clamp(v, 0, 1)),
});
```

- **Linked mode** (`useEyeSettingsStore.linked`): when true, the writable computed sets _both_ eyes. Keep this logic in a small composable `useEyeParam(eye, condition, key)` so components don't repeat the pattern.

- **Bridge watchers** in `usePhaser.ts`:

```ts
watch(
  () => [store.left, store.right, view.viewMode],
  () => pipelineManager.syncFromStore(),
  { deep: true, flush: 'post' },
);
```

`syncFromStore()` reads the current state, enables/disables pipelines, and updates uniforms. It must be cheap — O(conditions), not O(pixels).

## Pinia setup

```ts
// src/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './styles/reset.css';
import './styles/tokens.css';
import './styles/app.css';

const app = createApp(App);
app.use(createPinia());
app.mount('#app');
```

## Persistence — explicitly not done

We do **not** persist settings to `localStorage` automatically in v1. Reasoning: opening the simulator should always start clean, so users don't get confused by leftover settings from a previous session. The "Export preset" button covers the legitimate persistence case.

If users complain, v1.1 can add an opt-in "Remember last session" toggle.
