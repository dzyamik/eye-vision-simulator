# 07 — Roadmap

Implementation is split into **9 phases**, each broken into small, checkable steps. Work them in order. Tick the box when a step is done.

Each step lists its **acceptance criteria** — concrete things that must be true before the step is considered complete. Don't move on until they're all true.

When you finish a step, also do a quick "smoke test" — run `npm run dev` and click around. The whole app should still load.

---

## Phase 1 — Project scaffolding

Goal: get a Vite + Vue + TS + Pinia + Phaser project building to `./docs/` with nothing in it yet.

### 1.1 Initialize the project

- [x] `npm create vite@latest . -- --template vue-ts` (or initialize manually if Vite scaffolds nest into a subfolder).
- [x] Move/copy the scaffolded files into the project root, preserving `README.md`, `CLAUDE.md`, `dev-docs/`, `.claude/`.
- [x] `npm install`.
- [x] Delete the demo `HelloWorld.vue` and starter assets.

**Acceptance:** `npm run dev` opens a blank page with the project title in the tab. `tsc --noEmit` passes.

### 1.2 Install Pinia and Phaser

- [x] `npm install pinia phaser`.
- [x] Wire Pinia into `main.ts`.
- [x] Add Phaser's types via the bundled `phaser` package (no extra `@types` package needed).

**Acceptance:** `import { defineStore } from 'pinia'` and `import Phaser from 'phaser'` both work in a scratch file.

### 1.3 Configure Vite for `docs/` output and GH Pages base path

- [x] Edit `vite.config.ts` per [`02-tech-stack.md`](./02-tech-stack.md). Set `build.outDir = 'docs'`, `base = '/<repo-name>/'`.
- [x] Configure GLSL imports via `?raw` and add to `assetsInclude`.
- [x] Add path alias `@ → src`.

**Acceptance:** `npm run build` produces a `docs/` folder; `npm run preview` serves it at the correct base path.

### 1.4 Folder skeleton

- [x] Create empty folders matching [`01-architecture.md`](./01-architecture.md): `src/{components/{layout,viewer,sidebar},composables,stores,phaser/{pipelines,shaders},constants,types,styles,utils}`.
- [x] Add `.gitkeep` files where needed.
- [x] Move base styles in: `reset.css`, `tokens.css` (from [`05-ui-ux-design.md`](./05-ui-ux-design.md)), empty `app.css`.

**Acceptance:** `ls src/` matches the architecture doc; the build still succeeds.

### 1.5 ESLint + Prettier (optional but recommended)

- [x] Install `eslint`, `@vue/eslint-config-typescript`, `eslint-plugin-vue`, `prettier`.
- [x] Add `npm run lint` and `npm run format` scripts.

**Acceptance:** `npm run lint` runs without errors on the empty project.

---

## Phase 2 — Core types and stores

Goal: get the data model in place before any UI.

### 2.1 Implement `src/types/eyeSettings.ts`

- [x] Type definitions and `createDefaultEyeSettings()` factory from [`06-state-management.md`](./06-state-management.md).

**Acceptance:** Strict TS compile passes; `createDefaultEyeSettings()` returns the expected shape.

### 2.2 Implement Pinia stores

- [x] `useEyeSettingsStore` with left/right/linked + reset/copy.
- [x] `useViewSettingsStore` with activeEye and viewMode.
- [x] `useImageStore` with sample list and file loader.
- [x] `usePresetsStore` skeleton (built-in list empty for now).

**Acceptance:** Stores instantiate without errors; their `state` shapes match the docs; basic actions don't throw.

### 2.3 Constants and ranges

- [x] `src/constants/ranges.ts`: min/max/default for every numeric parameter (mirror `03-eye-conditions.md`).
- [x] `src/constants/colorMatrices.ts`: full matrices from `04-shaders-reference.md`.

**Acceptance:** All values are typed `as const`; importable from components later.

### 2.4 Unit tests for stores (optional)

- [x] Set up Vitest.
- [x] Test: reset clears one eye, leaves the other; copy duplicates; linked mode propagates.

**Acceptance:** Tests pass. (Skip the whole step if Vitest isn't desired.)

---

## Phase 3 — Layout shell and image input

Goal: a static page that loads an image into Pinia and renders it (no Phaser yet).

### 3.1 `AppShell`, `TopBar`, layout grid

- [x] Two-column grid (viewer left, sidebar right), responsive per [`05-ui-ux-design.md`](./05-ui-ux-design.md).
- [x] `TopBar` with logo placeholder, sample-image dropdown (stub), Upload button.

**Acceptance:** Layout renders correctly at 1280×800 and 400×800 (sidebar collapses).

### 3.2 `ImageViewer` and `OriginalView`

- [x] Stack original on top, impaired placeholder beneath.
- [x] `OriginalView` renders `<img :src="image.current.src">`, `object-fit: contain`, fills its container.

**Acceptance:** When `useImageStore.current` is set to a sample image, it renders in the top viewer.

### 3.3 Image upload

- [x] File picker in `TopBar` calls `image.setFromFile`.
- [x] Drag-drop anywhere on the viewer area calls the same action.
- [x] Reject files >10 MB with a toast.

**Acceptance:** Dragging an image onto the page updates the top viewer; the filename appears in a small caption.

### 3.4 Sample images

- [x] Add 4–6 public-domain images to `public/samples/`.
- [x] Add a manifest (`public/samples/index.json`) listing them with width/height/filename.
- [x] Fetch the manifest at app start, populate `image.sampleImages`.
- [x] Dropdown in `TopBar` lets the user pick one.

**Acceptance:** Each sample loads. The default sample is shown on first paint.

---

## Phase 4 — Phaser bridge

Goal: a Phaser canvas living inside `ImpairedView`, rendering the current image with **no** effects yet. This is the highest-risk integration moment.

### 4.1 `createGame.ts` and `VisionScene.ts`

- [x] Factory creates a Phaser game with `parent: HTMLElement`, `type: AUTO`, `transparent: false`, scale mode `RESIZE`.
- [x] `VisionScene` loads the current image as a texture and adds it as a single Sprite centered, scaled to fit the canvas.

**Acceptance:** Mounting `ImpairedView` shows the same image as `OriginalView`, but rendered through Phaser.

### 4.2 `usePhaser.ts` composable

- [x] Singleton-ish: creates the game on first call, returns the same handle subsequently.
- [x] Exposes `setImage(src)`, `dispose()`, and a `gameReady` promise.
- [x] Cleanly destroys old textures when swapping images.

**Acceptance:** Changing the image (sample → upload → another sample) updates the impaired view without leaking textures (verify in DevTools memory snapshot).

### 4.3 Resize handling

- [x] On window resize and on viewer-container resize (use `ResizeObserver`), the Phaser canvas resizes and the sprite re-centers/re-fits.

**Acceptance:** Resizing the window keeps both viewers showing the same image at the same aspect.

### 4.4 View mode toggle (stub)

- [x] `ViewModeToggle.vue` writes to `useViewSettingsStore.viewMode`.
- [x] Visible options: Both, Left, Right, Split. Implementation in phase 7.

**Acceptance:** The toggle changes state but has no visual effect yet.

---

## Phase 5 — Sidebar UI and per-eye editing

Goal: full sidebar UI with all sliders and toggles, wired to Pinia. Still no shaders.

### 5.1 `EyeSelector`

- [x] Segmented toggle Left / Right / Both bound to `useViewSettingsStore.activeEye`.
- [x] When "Both" is active, set `useEyeSettingsStore.linked = true`. When Left or Right, set it false and target that eye.

**Acceptance:** Switching tabs updates the store; "Both" mirrors edits across eyes.

### 5.2 Generic `ConditionPanel.vue`

- [x] Props: `condition: ConditionKey`, `title`, parameter slots.
- [x] Renders the enabled toggle, title, optional `[?]` info popover, and slots for sliders.
- [x] Sliders use a custom `<RangeInput>` component (label + range + numeric input + reset-to-default button).

**Acceptance:** A reference implementation for one condition (Myopia) is visible and editable. Slider drags update the store; toggling enabled greys out the slider.

### 5.3 Build out every condition panel

- [x] Refractive group: Myopia, Hyperopia, Astigmatism (with axis dial), Presbyopia.
- [x] Color group: ColorVision (type select + severity slider).
- [x] Lens group: Cataract (subtype radio + four sliders).
- [x] Field loss group: Glaucoma, AMD, Diabetic retinopathy, Retinitis pigmentosa.
- [x] Overlays group: Floaters, Migraine aura.
- [x] Custom mask group: (UI only; canvas wiring in phase 8).

**Acceptance:** Every parameter from `03-eye-conditions.md` is reachable in the UI. Tooltips show short descriptions.

### 5.4 Reset and copy actions

- [x] "Reset eye" button in each eye's settings area calls `resetEye`.
- [x] "Copy → other eye" button calls `copy`.

**Acceptance:** Both work as expected.

### 5.5 Astigmatism axis dial

- [x] A circular control component that lets users drag to set the axis (0–180°).
- [x] Syncs with the numeric input.

**Acceptance:** Dragging the dial updates the angle; the numeric input updates simultaneously.

---

## Phase 6 — Shader pipelines (the meat)

Goal: every eye condition renders correctly. This phase has the most steps and is the most fun.

For each pipeline, the pattern is:

1. Write the `.frag.glsl` from `04-shaders-reference.md`.
2. Write the `Pipeline.ts` class extending `PostFXPipeline` (or Phaser 4's filter), declaring uniforms.
3. Add it to `pipelineManager.ts`'s registry.
4. Wire a `watch` so the store changes flow to the pipeline uniforms.
5. Manual visual check vs reference image.

### 6.1 Pipeline manager skeleton

- [x] `pipelineManager.ts` exposes `attach(camera, conditionKey)`, `detach(camera, conditionKey)`, `setUniforms(conditionKey, uniforms)`, `syncFromStore()`.
- [x] Maintains the stacking order from `03-eye-conditions.md`.

**Acceptance:** The manager exists, has no pipelines yet, and `syncFromStore()` is a no-op.

### 6.2 Blur pipeline (myopia / hyperopia / presbyopia)

- [x] `BlurPipeline.ts` with two-pass separable Gaussian.
- [x] One instance per eye combined-blur (sum of myopia + hyperopia + presbyopia strengths, clamped).
- [x] Wired into `syncFromStore`.

**Acceptance:** Dragging the Myopia strength slider on either eye produces visible blur within one frame.

### 6.3 Astigmatism pipeline

- [x] Directional blur shader.
- [x] Wired with magnitude and axis from the store.

**Acceptance:** Vertical lines blur more than horizontal at axis=90°, and vice versa at axis=0°.

### 6.4 Color vision pipeline

- [x] Matrix-based shader with sRGB→linear→matrix→sRGB.
- [x] Type select switches the matrix; severity mixes with identity.

**Acceptance:** Switching to "deuteranopia" with severity=1.0 produces a recognizably red/green-confused output. Compare against the reference matrices in `04-shaders-reference.md`.

### 6.5 Cataract pipeline

- [x] Combined yellowing + cloudiness + brightness loss + glare shader.
- [x] Use a small noise PNG in `public/textures/` for cloud variation.
- [x] Subtype radio buttons preset the four sliders.

**Acceptance:** Each subtype produces a visually distinct result matching the descriptions in `03-eye-conditions.md`.

### 6.6 Glaucoma + retinitis pigmentosa pipelines

- [x] Vignette shader; RP uses tighter defaults and adds inside-region brightness loss.

**Acceptance:** Tunnel-vision effect with adjustable radius; RP version dims the visible region too.

### 6.7 AMD pipeline

- [x] Central scotoma + optional UV distortion via noise.

**Acceptance:** With distortion=1.0, straight lines in the image visibly bend near the center.

### 6.8 Diabetic retinopathy pipeline

- [x] Seeded-RNG spot positions in JS; uniform array uploaded to the shader.
- [x] `spotCount` and `spotSize` changes regenerate positions stably.

**Acceptance:** Spots don't randomly jump on minor parameter tweaks; severity slider darkens them.

### 6.9 Floaters (sprite-based, not a shader)

- [x] Add a few floater PNG textures to `public/textures/`.
- [x] Spawn N sprites with random positions, drifting slowly.
- [x] Respect `prefers-reduced-motion`.

**Acceptance:** A handful of floaters drift across the impaired view; opacity slider works.

### 6.10 Migraine aura (static v1)

- [x] One PNG overlay; position adjustable via the store.
- [x] If `animate` is true, slow outward drift via a sprite tween.

**Acceptance:** A zigzag pattern appears near the configured position.

---

## Phase 7 — View modes

Goal: the bottom view supports Both / Left / Right / Split.

### 7.1 Single-camera modes (Both / Left / Right)

- [x] `pipelineManager.syncFromStore` reads `viewMode` and computes which eye's settings (or blend) to apply.
- [x] "Both" mode averages the active uniforms from left+right. (Strict averaging is wrong physiologically, but a reasonable proxy for v1. Document this.)

**Acceptance:** Switching between Left/Right/Both visibly changes the output to match each eye's individual settings.

### 7.2 Split view

- [x] Two cameras side by side, each with its own pipeline stack.
- [x] A thin labeled divider drawn at the midline.

**Acceptance:** With different settings per eye, the canvas shows them side-by-side.

---

## Phase 8 — Custom mask drawing

Goal: paint per-eye scotomas onto a canvas, apply as a pipeline effect.

### 8.1 `useMaskCanvas.ts` composable

- [x] Owns the offscreen canvas + paint state.
- [x] `paintAt(x, y, size, hardness, mode)` applies a brush stroke.
- [x] Returns `ImageData` on demand, debounced.

**Acceptance:** Unit-testable; manually verified that calling `paintAt` modifies the canvas.

### 8.2 `MaskPanel.vue`

- [x] Renders the preview image underneath at low alpha.
- [x] Paint canvas on top accepts pointer events.
- [x] Brush size, hardness, mode (paint / erase / clear) controls.

**Acceptance:** A user can paint, erase, and clear; the mask is visible during editing.

### 8.3 `CustomMaskPipeline.ts`

- [x] Reads the mask `ImageData` as a `THREE`-free WebGL texture and applies the chosen effect (v1: darken).
- [x] Re-uploads the mask only when it actually changes (compare reference equality).

**Acceptance:** Painted areas darken the corresponding pixels in the impaired view, within ~50 ms of pointer release.

### 8.4 Copy mask to other eye

- [ ] Button copies the active eye's `maskData` to the other.

**Acceptance:** Works without side effects (deep clone).

---

## Phase 9 — Presets, polish, and ship

### 9.1 Built-in presets

- [ ] Populate `usePresetsStore.builtIn` with the six presets from `05-ui-ux-design.md`.
- [ ] Loading a preset replaces both eyes' settings.

**Acceptance:** Each built-in preset produces a recognizable, distinct visual result.

### 9.2 Export / import preset JSON

- [ ] Serialize current state (including mask as base64 PNG) to a downloadable JSON.
- [ ] File-picker import restores state.

**Acceptance:** Round-trip export → import produces an identical visual result.

### 9.3 Tooltips and info popovers

- [ ] Every condition's `[?]` shows its description.
- [ ] Disclaimer banner appears once at first run, dismissible.

**Acceptance:** No undocumented controls.

### 9.4 Performance pass

- [ ] Profile with all conditions enabled on a 1080p image; aim for ≥30 fps.
- [ ] Coalesce slider events with `requestAnimationFrame`.
- [ ] Verify no memory leaks across image swaps (DevTools).

**Acceptance:** Targets in `01-architecture.md` met.

### 9.5 Empty / error states

- [ ] No image: friendly placeholder.
- [ ] WebGL unsupported: graceful message.
- [ ] Image load failure: toast.

**Acceptance:** Every state is handled visibly; no console errors in normal flows.

### 9.6 README polish + build

- [ ] Update README screenshots once UI is done.
- [ ] `npm run build`; commit `docs/`; enable GH Pages.

**Acceptance:** The live URL works.

---

## Phase 10 — Shareable URL state

> **Added 2026-05-11 by user request, mid-Phase-5.** Make the entire app
> state (slider values, enabled toggles, sync flag, view mode, current
> sample image) round-trip through the URL so a user can copy-paste a link
> and reproduce the exact configuration. The painted mask data is
> deliberately excluded — it's too large for URL params; masks travel via
> the preset JSON path (9.2).

### 10.1 URL state schema

- [ ] Pick an encoding strategy: a single `?s=<base64-of-json>` blob keeps
      the schema flexible; one-param-per-condition keeps the URL human-
      readable but rigid. Default: single base64 blob with a leading
      schema-version field so future shape changes don't break old links.
- [ ] Document the schema in a new `dev-docs/11-url-state.md`: which
      fields are included, how the version field gates breaking changes,
      what's intentionally excluded (mask data, uploaded images that live
      only as data URLs in memory).

**Acceptance:** A doc that any future contributor can read to understand
the wire format; a tiny pure encode/decode helper that round-trips an
EyeSettings + ViewSettings shape without loss (excluding mask).

### 10.2 `useUrlSync.ts` composable

- [ ] On app load: parse `window.location.search`; if `?s=` is present,
      decode and apply to `useEyeSettingsStore` + `useViewSettingsStore`
      + `useImageStore` (sample selection).
- [ ] Watch the relevant stores; on change, debounce ~300 ms then write
      `URLSearchParams` via `history.replaceState` (NOT `pushState` — back
      button shouldn't accumulate one entry per slider tick).
- [ ] Skip writes when the encoded string equals the current `?s=`
      (avoids no-op `replaceState` calls during transient equal states).

**Acceptance:** Editing sliders updates the URL bar live; pasting a
copied URL into a new tab restores all settings; back-button history
stays clean.

### 10.3 "Copy link" button

- [ ] Small button in `TopBar` calls `navigator.clipboard.writeText` with
      the current URL; toast on success/failure (handles clipboard-API
      rejections gracefully — Safari sometimes refuses without a user
      gesture inside a Promise chain).

**Acceptance:** One-click copy of the current shareable URL.

### 10.4 Round-trip test

- [ ] Vitest: encode → decode round-trip preserves every numeric and
      enum field across both eyes (excluding mask).
- [ ] Test: a stale URL with a missing-since-yesterday field decodes
      gracefully via the schema-version gate (use the current default
      for absent fields).

**Acceptance:** Tests pass. Forward-compatibility for the lifetime of v1.

---

## Out of scope for v1 (parked for v1.1+)

- Webcam input.
- Localization (i18n).
- Light theme.
- Undo/redo history.
- More accurate Brettel-Viénot color matrices in LMS space.
- Gaze-contingent simulation (eye tracking).
- Arcuate scotoma patterns for glaucoma as a built-in (workaround: custom mask).
- Mask effects beyond `darken`.

Track these in GitHub Issues once the repo exists.
