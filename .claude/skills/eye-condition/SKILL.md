---
name: eye-condition
description: Use this skill when adding an entirely new eye condition to the simulator, end-to-end: type definition, store default, sidebar panel, pipeline class, fragment shader, and pipeline manager wiring. Triggers on requests like "add support for [condition]", "implement [condition]", "add a new eye condition", or when modifying multiple files together to introduce a new condition. Do NOT use this skill if you are only tweaking an existing condition's parameters or shader — use shader-development or vue-component instead.
---

# Add a New Eye Condition

This skill is the end-to-end checklist for adding a brand-new condition to the simulator. It touches 5–6 files. Skipping a step leaves the codebase in an inconsistent state.

## Before you start

You need answers to these. **Ask the user if anything is unclear.**

1. **Name:** human-readable display name (e.g. "Convergence insufficiency") and a `camelCase` key for code (e.g. `convergenceInsufficiency`).
2. **Group:** which sidebar group does it belong to? (`Refractive`, `Color`, `Lens`, `Field loss`, `Overlays`, `Custom`).
3. **Parameters:** what's adjustable? Each parameter needs a name, a numeric range (min/max/default), and one sentence explaining what it does.
4. **Visualization approach:** is this a shader? A sprite overlay? A modifier of an existing pipeline? Most conditions are shaders.
5. **Stacking position:** where in the render order? (See the order in `dev-docs/03-eye-conditions.md` § "Pipeline stacking order".)

If you can answer #4 with a published reference (paper, blog post, reference simulator), find and read it before writing code.

## The 6-step workflow

Do these in order. **Don't skip ahead.** After each step, the project should still build.

### Step 1 — Update the canonical types

Edit `src/types/eyeSettings.ts`:

1. Add a field to the `EyeSettings` interface:
   ```ts
   <key>: { enabled: boolean; param1: number; param2: number /* ... */ };
   ```
2. Add the defaults in `createDefaultEyeSettings()`.
3. The `ConditionKey` type updates automatically from `keyof EyeSettings`.

Verify: `npm run type-check` passes.

### Step 2 — Add constants

Edit `src/constants/ranges.ts`. Add an entry:

```ts
export const <KEY>_RANGES = {
  param1: { min: 0, max: 1, default: 0, step: 0.01 },
  // ...
} as const;
```

If the condition uses a fixed matrix/array (like color vision), also add that as a `const` here.

### Step 3 — Add the sidebar panel

Create `src/components/sidebar/panels/<Name>Panel.vue`. Use the `vue-component` skill conventions.

The panel:
- Takes an `eye: 'left' | 'right'` prop.
- Renders a `<ConditionPanel>` with the toggle, title, and sliders for each parameter.
- Each slider is a `<RangeInput>` bound to a writable computed pointing at the store.

Add the panel to the correct group in `src/components/sidebar/Sidebar.vue`.

### Step 4 — Write the fragment shader

Create `src/phaser/shaders/<name>.frag.glsl`.

Follow the conventions in `.claude/skills/shader-development/SKILL.md`. Required preamble:

```glsl
precision mediump float;
uniform sampler2D uMainSampler;
varying vec2 outTexCoord;
// uniforms for this condition
uniform float uParam1;
// ...

void main() {
  vec4 c = texture2D(uMainSampler, outTexCoord);
  // ...
  gl_FragColor = vec4(result, c.a);
}
```

If this isn't shader-based (sprite overlay like floaters, or a CPU-managed thing), skip this step.

### Step 5 — Write the pipeline class

Create `src/phaser/pipelines/<Name>Pipeline.ts`. Template:

```ts
import Phaser from 'phaser';
import fragShader from '@/phaser/shaders/<name>.frag.glsl?raw';

export class <Name>Pipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  private _param1 = 0;

  constructor(game: Phaser.Game) {
    super({ game, name: '<Name>Pipeline', renderTarget: true, fragShader });
  }

  setParam1(v: number) { this._param1 = v; }

  onPreRender() {
    this.set1f('uParam1', this._param1);
  }
}
```

Multi-pass shaders: override `onDraw` (see `shader-development` skill).

### Step 6 — Wire into the pipeline manager

Edit `src/phaser/pipelineManager.ts`:

1. Import the new pipeline class.
2. Add it to the stacking-order array in the correct position (see `dev-docs/03-eye-conditions.md`).
3. In `syncFromStore`:
   ```ts
   const cond = settings.<key>;
   if (cond.enabled) {
     <name>Pipeline.setParam1(cond.param1);
     attach(<name>Pipeline);
   } else {
     detach(<name>Pipeline);
   }
   ```
4. Register the pipeline with Phaser's pipeline manager in the scene's `create` method.

### Verification

After all 6 steps:

1. `npm run type-check` passes.
2. `npm run build` succeeds.
3. `npm run dev`: the new condition appears in the sidebar in the correct group, all sliders work, toggling enabled produces a visible effect.
4. Update `dev-docs/03-eye-conditions.md` with the new condition's table entry and parameters.
5. Update `dev-docs/07-roadmap.md` (if there's a relevant phase to mark off, or add a new "added [condition]" line under v1.1+).

## Pitfalls specific to this workflow

| Pitfall | Fix |
|---|---|
| Forgot to add to `createDefaultEyeSettings` | Toggling the condition crashes with undefined access. Always update both the type and the factory. |
| Pipeline added to manager but not registered with Phaser | The effect doesn't render. Scene's `create()` needs `this.renderer.pipelines.addPostPipeline('<Name>Pipeline', <Name>Pipeline)`. |
| Wrong stacking order | Cataract applied after a vignette looks wrong; color matrix applied after blur looks wrong. Refer to the order in `03-eye-conditions.md`. |
| Slider doesn't update the view | Did you remember to call `syncFromStore` from the watcher, or wire the new condition into the existing watcher's deep watch? |
| Build fails on the GLSL import | Vite needs `?raw`: `import fragShader from '.../<name>.frag.glsl?raw'`. Also check that `.glsl` is in `assetsInclude` in `vite.config.ts`. |

## When NOT to add a new condition

- If it's a variant of an existing condition (e.g. "moderate myopia" — just use the strength slider).
- If it would be better as a built-in preset combining existing conditions.
- If it doesn't have a visual representation we can plausibly simulate (e.g. "fatigue" — out of scope).
- If the user is asking for an *option* on an existing condition (add a parameter to the existing one instead).

If in doubt, ask the user before doing all six steps.
