---
name: shader-development
description: Use this skill when writing, modifying, or debugging GLSL shaders in this project, including creating a new PostFXPipeline, fixing visual artifacts in an existing pipeline, or porting a reference algorithm into the project's pipeline format. Triggers include any work in src/phaser/pipelines/ or src/phaser/shaders/, anything mentioning "shader", "PostFX", "fragment shader", "uniform", or "GLSL", and any task involving the visual appearance of the impaired-view canvas.
---

# Shader Development

This skill walks you through writing or modifying a fragment shader and its accompanying Phaser pipeline class in this project.

## Before you write any GLSL

1. Read `dev-docs/04-shaders-reference.md`. It has the reference implementation for every shader the project plans to ship.
2. Read `dev-docs/03-eye-conditions.md` for the relevant condition's parameter list and ranges.
3. Skim `dev-docs/08-coding-standards.md` § "Shaders (GLSL)" for naming and style rules.

If you're modifying an existing shader, also read the matching `Pipeline.ts` to see which uniforms are wired through.

## File layout for a new pipeline

```
src/phaser/
├── pipelines/
│   └── <Name>Pipeline.ts        # extends PostFXPipeline, declares uniforms
└── shaders/
    └── <name>.frag.glsl         # the fragment shader source
```

For multi-pass effects (blur, astigmatism), still one shader file — the pipeline runs it twice.

## The 6-step shader workflow

### 1. Write the GLSL

Start from `04-shaders-reference.md`. Copy the reference shader for the condition; adjust uniform names if needed.

Required at the top:

```glsl
precision mediump float;
uniform sampler2D uMainSampler;
varying vec2 outTexCoord;
```

Required for shaders that operate on color (color vision, anything mixing colors):

```glsl
vec3 srgbToLinear(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
}
vec3 linearToSrgb(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0/2.4)) - 0.055, step(0.0031308, c));
}
```

Skip the sRGB conversions for pure spatial filters (blur, vignettes) — they don't need them and the conversions slow down the inner loop.

### 2. Write the pipeline class

Template:

```ts
// src/phaser/pipelines/<Name>Pipeline.ts
// <one-sentence description>
// Reference: dev-docs/04-shaders-reference.md § <section>
import Phaser from 'phaser';
import fragShader from '@/phaser/shaders/<name>.frag.glsl?raw';

export class <Name>Pipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  private _strength = 0;

  constructor(game: Phaser.Game) {
    super({ game, name: '<Name>Pipeline', renderTarget: true, fragShader });
  }

  setStrength(v: number) { this._strength = v; }

  onPreRender() {
    this.set1f('uStrength', this._strength);
    // for two-pass shaders, also set2f('uResolution', ...) etc.
  }
}
```

For **two-pass** shaders (blur, astigmatism), override `onDraw`:

```ts
onDraw(renderTarget: Phaser.Renderer.WebGL.RenderTarget) {
  this.set2f('uDirection', 1, 0);
  this.drawFrame(renderTarget, this.fullFrame1);
  this.set2f('uDirection', 0, 1);
  this.bindAndDraw(this.fullFrame1);
}
```

### 3. Register the pipeline

In `src/phaser/pipelineManager.ts` (or wherever the registry lives), add the new pipeline to the stacking-order array. The order matters — see `dev-docs/03-eye-conditions.md` § "Pipeline stacking order".

### 4. Wire it to the store

The pipeline manager has a `syncFromStore()` function that reads the relevant Pinia state and calls the pipeline's setters. Add a branch for the new condition:

```ts
if (settings.<conditionKey>.enabled) {
  pipeline.setStrength(settings.<conditionKey>.strength);
  attachIfNotAttached(pipeline);
} else {
  detachIfAttached(pipeline);
}
```

`watch()` calls on the store fire `syncFromStore` automatically.

### 5. Manual visual check

`npm run dev`, load a sample image, enable the new condition. Verify:

- **Off state:** with `enabled: false` (or strength 0), the impaired view is pixel-identical to the original.
- **Monotonic:** dragging the slider from 0 → 1 produces a smooth, monotonic change. No jumps, no flicker.
- **Edges:** the shader works correctly at the image edges (no black borders, no wraparound artifacts).
- **Compared to reference:** the result looks similar to the reference images in `dev-docs/03-eye-conditions.md`. Not identical — these are approximations — but in the same neighborhood.

Don't ship a shader that doesn't pass all four.

### 6. Update the roadmap

Tick the relevant box in `dev-docs/07-roadmap.md`. If you discovered something worth noting (a parameter range that needs adjustment, a follow-up shader fix), add a line.

## Common pitfalls

| Symptom | Likely cause |
|---|---|
| Black image | Forgot to declare a uniform or it's not being set; or `precision mediump float;` is missing. |
| Image visible but no effect | `enabled` not propagating; uniform not actually updated in `onPreRender`; pipeline not attached to the camera. |
| Visible band/seam at edges | Shader is sampling outside [0,1] UV without clamping. Use `clamp(uv, 0.0, 1.0)` or fix the kernel offset math. |
| Color shifts in unexpected places | Forgot the sRGB → linear → operate → linear → sRGB sandwich for any color-mixing shader. |
| Slider drag is jerky | Too many uniform updates per frame; coalesce with `requestAnimationFrame`. |
| Wrong color blindness output | Matrix transposed (row vs column-major mismatch). Try transposing before calling Brettel-Viénot the wrong matrix. |

## Phaser 4 (filters) vs Phaser 3 (pipelines)

If the project is on Phaser 4, replace `PostFXPipeline` with the new `Filter` system. The shader source itself is identical; the wrapper class differs. Check the version in `package.json` first and use the docs for that version:

- Phaser 3: <https://docs.phaser.io/api-documentation/class/renderer-webgl-pipelines-postfxpipeline>
- Phaser 4 filter system overview: <https://phaser.io/news/2026/05/phaser-4-filter-system>

The conventions in this skill are written for Phaser 3. Adapt accordingly.

## References

- `dev-docs/04-shaders-reference.md` — primary reference
- Brettel, Viénot, Mollon (1997) — color vision math foundations
- libDaltonLens — well-vetted color vision matrices: <https://daltonlens.org/>
- Phaser PostFXPipeline docs (above)
