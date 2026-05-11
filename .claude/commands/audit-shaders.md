---
description: Review every fragment shader and pipeline class for correctness, performance, and consistency.
---

You are auditing every shader and pipeline in the Eye Vision Simulator. Be thorough but pragmatic.

## Scope

- Every file in `src/phaser/shaders/*.frag.glsl`
- Every file in `src/phaser/pipelines/*Pipeline.ts`
- The orchestration in `src/phaser/PipelineManager.ts`
- The reference doc `dev-docs/04-shaders-reference.md`

## What to check

For each `*.frag.glsl`:

1. **Header is consistent.** Precision declaration, uniform declarations grouped at top, `varying vec2 outTexCoord` matches Phaser's convention.
2. **No dead uniforms.** Every uniform declared is actually read. Every uniform read is set from the pipeline class.
3. **Branch-free where possible.** Replace `if` with `mix()` / `step()` / `smoothstep()` when the branch is on a uniform or coordinate. Branching on a per-pixel value is acceptable only when the early-out is a real win.
4. **No texture sampling in a loop with a variable upper bound.** Loops must have compile-time bounds.
5. **Coordinate space is correct.** `outTexCoord` is 0..1. If centering, subtract 0.5 and account for aspect ratio when the shape should be circular.
6. **Gamma awareness.** If mixing colors that represent light intensity (e.g. blur + brightness), note whether the math assumes linear or sRGB. Document the assumption in a comment.
7. **No `discard`** unless absolutely necessary. It defeats early-Z and hurts performance on tiled GPUs.

For each `*Pipeline.ts`:

1. **Uniform setter names match the GLSL.** Typos here fail silently.
2. **`onPreRender` or equivalent sets every dynamic uniform every frame** (or the pipeline is marked dirty when state changes — pick one strategy and stick to it).
3. **Two-pass effects** (e.g. separable Gaussian) declare the second pass correctly and pass intermediate render targets in the right order.
4. **Resource lifecycle.** No leaked WebGL textures. If the pipeline owns a render target, it is released in `destroy()`.
5. **Per-eye uniforms.** If the simulator is in split-view or single-eye mode, the pipeline reads from the active eye's settings, not a hardcoded side.

For `PipelineManager.ts`:

1. **Stacking order matches `dev-docs/01-architecture.md`.** Color vision → cataract → refractive → AMD distortion → custom mask → glaucoma/RP/AMD scotoma → diabetic retinopathy → floaters → migraine aura.
2. **Pipelines that are "off" (intensity 0 or disabled flag) are detached**, not just sent neutral uniforms. Detached pipelines cost zero per-pixel work.
3. **Watchers are scoped.** Each Pinia watcher unsubscribes when the Phaser scene is destroyed.

## Output format

Produce a single markdown report. For each file:

````
### src/phaser/shaders/<file>.frag.glsl
- ✅ Header consistent
- ✅ No dead uniforms
- ⚠️ Line 34: branch on `uniform float intensity` — replace with `mix()`
- ❌ Line 51: `for (int i = 0; i < uCount; i++)` — `uCount` must be a compile-time constant

Suggested patch:
```glsl
<diff>
````

```

At the end, give a **prioritized fix list**:
1. Critical (will break on some GPUs)
2. Performance (measurable frame-time cost)
3. Style (consistency, not behavior)

## Hard rules

- **Do not edit any file during the audit.** Produce the report only.
- **Do not suggest rewrites just because you would have done it differently.** Flag actual defects.
- **If a shader matches the reference in `dev-docs/04-shaders-reference.md` and the reference is itself wrong**, flag both — but separately.
```
