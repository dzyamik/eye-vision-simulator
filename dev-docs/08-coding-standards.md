# 08 — Coding Standards

The point of these standards is consistency across many small Claude Code sessions. Following them takes maybe five minutes of attention per file; ignoring them creates technical debt that compounds over the project's life.

## TypeScript

- `strict: true` always. No exceptions.
- No `any`. If something must be `any`, leave a comment with a one-line reason.
- Prefer `interface` for object shapes that may be extended; `type` for unions, mapped types, and aliases.
- Function parameter types are always declared. Return types are declared for exported functions.
- Use `readonly` for arrays you don't intend to mutate (e.g. constants).
- Use `as const` for literal-type narrowing of constants.

```ts
// good
export interface RangeSpec { min: number; max: number; default: number; step?: number; }
export const MYOPIA_RANGE: RangeSpec = { min: 0, max: 1, default: 0, step: 0.01 } as const;

// bad
export const MYOPIA_RANGE = { min: 0, max: 1, default: 0 };
```

## Vue

- `<script setup lang="ts">` only.
- Use `defineProps<{ ... }>()` with TS types, never the runtime object form.
- Keep components ≤ ~150 lines. Split when growing.
- Don't put logic in templates beyond simple conditionals and formatting; move complexity into computed refs.
- One component per file. Filename in `PascalCase`.

```vue
<!-- good -->
<script setup lang="ts">
import { computed } from 'vue';
import { useEyeSettingsStore } from '@/stores/eyeSettings';

const props = defineProps<{ eye: 'left' | 'right' }>();
const store = useEyeSettingsStore();
const strength = computed<number>({
  get: () => store[props.eye].myopia.strength,
  set: (v) => { store[props.eye].myopia.strength = v; },
});
</script>

<template>
  <RangeInput v-model="strength" label="Strength" :min="0" :max="1" :step="0.01" />
</template>
```

## Pinia

- Setup-style stores (factory function), not options style — better TS inference.
- One store per domain. Don't pile unrelated state into one big store.
- Actions go in the store; components call them.
- No store imports inside other store *file modules* unless absolutely necessary (call them at the top of an action instead).

## CSS

- One stylesheet per component, scoped: `<style scoped> ... </style>`.
- Global tokens in `src/styles/tokens.css`. **Never** hard-code colors or spacing in components.
- BEM-ish naming inside components is fine but rarely needed because `scoped` isolates styles.
- Mobile-first media queries (`@media (min-width: ...)`).

```css
/* good */
.panel {
  background: var(--bg-2);
  padding: var(--pad);
  border-radius: var(--radius);
}

/* bad */
.panel {
  background: #161922;
  padding: 12px;
  border-radius: 8px;
}
```

## File and naming conventions

| Thing | Convention | Example |
|---|---|---|
| Component | `PascalCase.vue` | `ConditionPanel.vue` |
| Composable | `useThing.ts`, default export named `useThing` | `usePhaser.ts` |
| Store | `src/stores/thing.ts`, exports `useThingStore` | `eyeSettings.ts` |
| Type file | `src/types/thing.ts` | `eyeSettings.ts` |
| Constants | `src/constants/thing.ts` | `colorMatrices.ts` |
| Shader (raw GLSL) | `<name>.frag.glsl` | `blur.frag.glsl` |
| Phaser pipeline | `<Condition>Pipeline.ts` | `BlurPipeline.ts` |

## Imports

- Absolute imports via `@/` for everything in `src/`. No `../../../` chains.
- Type-only imports use `import type { ... } from ...`.
- Group order: 1) external packages, 2) `@/` internal modules, 3) relative imports, 4) styles. Blank line between groups.

```ts
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { COLOR_MATRICES } from '@/constants/colorMatrices';
import type { ColorVisionType } from '@/types/eyeSettings';
```

## Phaser specifics

We're on **Phaser 4** (decided in roadmap step 1.2). Use the v4 Filter system, not v3's `PostFXPipeline`.

- One `Phaser.Game` per app lifetime. Created and destroyed by `usePhaser`.
- Game objects added in `Scene.create`. Don't add objects from outside the scene's lifecycle methods — use `scene.events.emit(...)` to request changes.
- Each eye condition is implemented as a Phaser 4 Filter. Subclass `Phaser.Filters.Filter` (or the appropriate Controller base) and register it with the camera's filter list. Stack order matches `03-eye-conditions.md`.
- Shader source is imported with `?raw`. Never put GLSL inline as a JS string.
- Update uniforms once per frame from the Filter's pre-render hook, not inside `onDraw`-equivalent draw callbacks.
- See <https://phaser.io/news/2026/05/phaser-4-filter-system> for the v4 Filter API overview. When the existing spec docs (`04-shaders-reference.md`, etc.) say "PostFXPipeline", read it as "Filter".

## Shaders (GLSL)

- One feature per file. The blur shader does blur. The cataract shader does the cataract compound effect. Don't merge unrelated effects into one shader.
- `precision mediump float;` at the top, always.
- Uniform names prefixed with `u` (e.g. `uStrength`).
- Varyings prefixed with `v` (e.g. `vUv` — but use `outTexCoord` for compatibility with Phaser's default vertex shader).
- Comment the math when it's non-obvious. The reader is a future Claude session that didn't see the paper you copied from.

## Comments

- Comment **why**, not **what**. The code shows the what.
- A short header at the top of each non-trivial file: one sentence on what the module is for, and any subtle constraints.
- For shaders, link the reference (paper, blog post, gist).

```ts
// src/phaser/pipelines/ColorVisionPipeline.ts
// Applies a 3x3 matrix in linear RGB to simulate color vision deficiency.
// Matrices: Brettel/Viénot family. See dev-docs/04-shaders-reference.md.
```

## Testing

- Stores and pure utilities: unit-tested with Vitest where it pays off (clamping logic, preset round-trip).
- Components: manual testing is fine; if a component has tricky logic, extract into a composable and test that.
- Pipelines: visual verification only. No automated pixel-comparison in v1.

## Performance habits

- Avoid `JSON.parse(JSON.stringify(x))` for deep clones in hot paths. Use `structuredClone`.
- Don't do CPU pixel work. If you're tempted, the answer is a shader.
- Debounce slider events that trigger expensive rebuilds (regenerating spot positions, refreshing the mask texture).
- Memoize derived data with `computed`, not `watch + ref`.

## Error handling

- User-facing errors: a small toast, no stack traces.
- Programmer errors (impossible states): throw early, throw clearly. `throw new Error('CustomMaskPipeline: maskData required when enabled')` is fine.
- Never silently swallow errors with empty `catch {}`. If you really must, log them.

## Git hygiene (if Claude Code is committing)

- Commits are atomic and have a single concern. "WIP" commits are fine in branches; squash them on merge.
- Conventional Commits prefix: `feat`, `fix`, `chore`, `refactor`, `docs`, `style`, `test`.
- Don't commit `node_modules/`, `dist/` (use `docs/` instead for the build).
- Commit `docs/` after each roadmap phase if the project is being live-deployed.

## When in doubt

If a rule conflicts with another, follow the one that makes the diff smaller for the next person to read.
