# 01 — Architecture

## System diagram (logical)

```
┌─────────────────────────────────────────────────────────────────┐
│                          VUE APP                                │
│                                                                 │
│   ┌───────────────┐    reads/writes    ┌──────────────────┐     │
│   │  Sidebar UI   │ ◄──────────────────│   Pinia stores   │     │
│   │  components   │                    │  (canonical      │     │
│   └───────────────┘                    │   state)         │     │
│                                        └────────▲─────────┘     │
│                                                 │               │
│   ┌─────────────────────┐                       │ watches       │
│   │  Image viewer       │                       │               │
│   │  - <OriginalView>   │                       │               │
│   │  - <ImpairedView>   │       ┌───────────────┴────────┐      │
│   │    └─ mounts canvas │──────►│  usePhaser composable  │      │
│   └─────────────────────┘       │  (singleton bridge)    │      │
│                                 └────────────┬───────────┘      │
└──────────────────────────────────────────────┼──────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │       PHASER 3 GAME              │
                              │  ┌────────────────────────────┐  │
                              │  │  VisionScene               │  │
                              │  │  - holds 1 image sprite    │  │
                              │  │  - camera has stacked      │  │
                              │  │    PostFXPipelines         │  │
                              │  └──────────┬─────────────────┘  │
                              │             │ uses               │
                              │             ▼                    │
                              │  ┌────────────────────────────┐  │
                              │  │  Pipelines (one per cond.) │  │
                              │  │  - BlurPipeline            │  │
                              │  │  - ColorVisionPipeline     │  │
                              │  │  - CataractPipeline        │  │
                              │  │  - GlaucomaPipeline        │  │
                              │  │  - ScotomaPipeline         │  │
                              │  │  - AstigmatismPipeline     │  │
                              │  │  - MaskPipeline (custom)   │  │
                              │  │  - ...                     │  │
                              │  └────────────────────────────┘  │
                              └──────────────────────────────────┘
```

## Single source of truth

**Pinia owns all state.** Pinia → Vue → Phaser is one-way. Phaser never originates state; it receives it via `watch()` callbacks. This avoids the classic "two reactive systems" tangle.

Even ephemeral things (the active eye tab, the current view mode, mask paint state) live in Pinia. The exception is true UI-local state — hover, focus, animation timers — which can stay in component refs.

## Module layout

```
src/
├── main.ts                       # Vue app bootstrap, Pinia install
├── App.vue                       # root component
│
├── components/
│   ├── layout/
│   │   ├── AppShell.vue          # 2-column layout (viewer + sidebar)
│   │   └── TopBar.vue            # branding, image upload, preset save/load
│   │
│   ├── viewer/
│   │   ├── ImageViewer.vue       # vertical stack of original + impaired
│   │   ├── OriginalView.vue      # plain <img> with object-fit: contain
│   │   ├── ImpairedView.vue      # mounts Phaser canvas, view-mode toolbar
│   │   └── ViewModeToggle.vue    # both / left / right / split
│   │
│   └── sidebar/
│       ├── AppSidebar.vue        # scrollable container (renamed from Sidebar to satisfy vue/multi-word-component-names)
│       ├── SyncToggle.vue        # "Sync both eyes" checkbox (replaced the original L/R/Both EyeSelector after 5.2 — see 05-ui-ux-design.md "Sidebar layout")
│       ├── ConditionGroup.vue    # collapsible group (e.g. "Refractive errors")
│       ├── ConditionPanel.vue    # one condition's shell: title + per-eye enabled toggles + slot
│       ├── RangeRow.vue          # one numeric param, rendered as L row + R row
│       ├── RangeInput.vue        # leaf slider (label + range + numeric input + reset)
│       ├── MaskPanel.vue         # per-eye scotoma canvas + brush controls
│       └── PresetPanel.vue       # load / save / clear / sample presets
│
├── composables/
│   ├── usePhaser.ts              # creates Phaser game, returns control fns
│   ├── useImageSource.ts         # handles file picker, drag-drop, sample list
│   ├── useMaskCanvas.ts          # paint logic for the scotoma canvas
│   └── useKeyboardShortcuts.ts   # optional, for power users
│
├── stores/
│   ├── eyeSettings.ts            # left + right eye full state
│   ├── viewSettings.ts           # which eye is active in UI, view mode
│   ├── image.ts                  # current image source (URL or data URL)
│   └── presets.ts                # named preset CRUD
│
├── phaser/
│   ├── VisionScene.ts            # the one scene
│   ├── createGame.ts             # factory called by usePhaser
│   ├── pipelineManager.ts        # adds/removes pipelines per Pinia state
│   ├── pipelines/
│   │   ├── BlurPipeline.ts
│   │   ├── AstigmatismPipeline.ts
│   │   ├── ColorVisionPipeline.ts
│   │   ├── CataractPipeline.ts
│   │   ├── GlaucomaPipeline.ts
│   │   ├── ScotomaPipeline.ts     # central (AMD)
│   │   ├── DiabeticRetinopathyPipeline.ts
│   │   ├── RetinitisPigmentosaPipeline.ts
│   │   ├── FloatersPipeline.ts
│   │   ├── MigraineAuraPipeline.ts
│   │   └── CustomMaskPipeline.ts  # uses the painted texture
│   └── shaders/
│       ├── astigmatism.frag.glsl   # directional Gaussian along the cyl axis
│       └── glaucoma.frag.glsl      # tunable-feather peripheral vignette
│
├── constants/
│   ├── colorMatrices.ts          # protan/deutan/tritan matrices + severity
│   └── ranges.ts                 # min/max/default for every slider
│
├── types/
│   ├── eyeSettings.ts            # canonical EyeSettings interface
│   ├── condition.ts              # union of all condition keys
│   └── preset.ts
│
└── styles/
    ├── tokens.css                # CSS variables (colors, spacing, type)
    ├── reset.css
    └── app.css
```

> **Why these `.frag.glsl` files?** Phaser 4's built-in `Filters` cover
> color-matrix, blend, vignette, and (separable) blur — enough for most
> conditions. Two cases needed custom GLSL: glaucoma's tunable `feather`
> (the built-in Vignette has a fixed falloff curve) and astigmatism's
> oblique-angle blur (the built-in Blur is separable, so it degrades to
> rotationally-symmetric blur at 45°/135° instead of a diagonal smear).
> Both pipelines register a custom RenderNode that extends
> `Phaser.Renderer.WebGL.RenderNodes.BaseFilterShader`. Future custom
> shaders follow the same pattern.

## Data flow walkthrough — "user drags the myopia slider"

1. The slider component is bound to `eyeSettings.left.myopia.strength` via `v-model` (with a debounce / requestAnimationFrame coalescer if needed).
2. Pinia state updates.
3. `pipelineManager` has a `watch` on `eyeSettings.*.myopia`. The watcher fires.
4. The manager checks which "view mode" is active. If the bottom view is showing both eyes blended, it averages the two eyes' blur values. If showing left-only, it uses left. Etc.
5. The watcher calls `blurPipeline.setStrength(value)` which calls `pipeline.set1f('uStrength', value)` on the WebGL uniform.
6. Phaser's render loop picks up the new uniform on the next frame.

Total latency: ≤ 1 frame.

## The Vue↔Phaser bridge

This is the part most likely to go wrong. Rules:

- The Phaser game is **created exactly once**, when the `ImpairedView` component mounts the first time. It is destroyed when the app unmounts (essentially, never).
- `usePhaser()` returns a stable object: `{ game, setImage, setEyeConfig, dispose }`.
- The composable installs `watch()` calls on the relevant stores. Inside the watchers, it calls the imperative Phaser methods.
- `setImage(srcOrFile)` loads the new texture into Phaser's texture manager and swaps the sprite's texture key. Old textures are explicitly destroyed.
- All pipeline state changes go through `setEyeConfig` (or finer-grained methods) — never reach into `game.scene` from a component.

## View modes — how rendering differs

The bottom view has four modes, controlled by `viewSettings.mode`:

| Mode    | What's rendered                                                                                                                                          |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `both`  | A blended average of left-eye and right-eye effects (default). Closest to lived perception.                                                              |
| `left`  | Left eye's config only. The image fills the canvas.                                                                                                      |
| `right` | Right eye's config only. The image fills the canvas.                                                                                                     |
| `split` | The canvas is split vertically. Left half = left eye, right half = right eye. Each half is a separately rendered sub-region with its own pipeline stack. |

`split` was implemented in roadmap step 7.2 with the two-cameras approach (cleaner than render-textures-into-shader). VisionScene owns the two extra cameras alongside the main one; `setSplitMode(enabled)` toggles which set is active by setting viewports (main → 0×0 when split, the two side cameras get half each, scrolled so the sprite is centred in each viewport). `pipelineManager.syncFromStore` branches on `viewMode === 'split'` and runs each filter pipeline twice — once with the left split camera + L-only params, once with the right + R-only params. To support that, every filter pipeline keeps its filters in a `WeakMap<Camera, Filter>` so the same module can drive separate filters on each camera. The split divider + L/R labels are a DOM overlay in `ImpairedView.vue`, not a Phaser game object, so they never pass through any filter. Sprite-based pipelines (Floaters, Migraine aura) are scene-wide game objects; in split mode their per-eye params still blend rather than render per side — a v1.1 cleanup if it matters.

## Custom mask architecture

Each eye has a `Uint8Array` (or `HTMLCanvasElement`) representing a painted alpha mask, sized to match the impaired view's resolution (or a fixed working resolution like 1024×1024 with a sampler).

When the user paints, `useMaskCanvas` writes to the canvas, and on mouse-up (or a debounced timer mid-stroke), it pushes the canvas's `ImageData` to Pinia. The `CustomMaskPipeline` watches and re-uploads the mask as a WebGL texture.

The shader reads the mask's alpha and darkens the input image accordingly (or applies whatever effect the user chose for that mask — start with "darken to black", extend later to "blur" or "distort").

## Performance budget

| Scenario                             | Target                       |
| ------------------------------------ | ---------------------------- |
| Slider drag, single condition active | 60 fps on a 2020 MacBook Air |
| All conditions on at once            | ≥ 30 fps                     |
| First paint of impaired view         | < 500 ms after image load    |
| Bundle size (gzipped)                | < 500 KB (Phaser dominates)  |

Slider-spam coalescing: use `requestAnimationFrame` to batch updates so the GPU isn't called more than once per frame.

## Error handling

- Failed image load → fall back to the default sample image, show a toast.
- WebGL not available → render an apologetic message; the app degrades to a "concept page".
- Out-of-range or NaN parameters → clamp on the way into Pinia (in store actions, not in components).
