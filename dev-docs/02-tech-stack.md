# 02 — Tech Stack

## At a glance

| Concern | Choice | Why |
|---|---|---|
| Language | TypeScript ≥ 5.4 | Type-safe parameter shapes across stores, components, and shaders. |
| Build | Vite ≥ 5 | Fast HMR; `outDir` overrideable for GH Pages; first-class Vue support. |
| UI | Vue 3 (Composition API) | Asked for in the brief; pairs cleanly with Pinia. |
| State | Pinia | The official Vue 3 state library; great TS inference. |
| Rendering | Phaser 3 (≥ 3.80) | Asked for in the brief; PostFXPipeline gives us a clean WebGL shader-stack abstraction without writing raw WebGL. |
| Styles | Plain CSS + variables | Keeps bundle tiny; no design system needed. |
| Lint/Format | ESLint + Prettier | Defaults. |
| Tests | Vitest + Vue Test Utils (optional) | Only for stores and utilities; pipelines are visual. |

## Why Phaser, given it's a game engine

Phaser is heavier than rolling our own WebGL, but it gives us free:

- A `PostFXPipeline` abstraction — apply a fragment shader to a render target, with uniform management. Stacking pipelines is trivial.
- Texture management — loading, replacing, destroying images.
- Render-target plumbing for the "split view" (two cameras, two pipelines, composite).
- Asset loader, GameObjects, cameras — useful for the "floaters" effect (sprites floating across the field).

If Phaser turns out to be overkill mid-project, we can swap to bare WebGL/regl — but the API surface is small enough (one Scene, one Sprite, N PostFXPipelines) that the dependency cost is acceptable.

**Phaser 3 vs 4:** Phaser 4 reworked the filter system (see <https://phaser.io/news/2026/05/phaser-4-filter-system>) into something much nicer. If Phaser 4 is stable at the time of implementation, prefer it — the unified Filter system maps better onto our needs. Otherwise stay on Phaser 3's `PostFXPipeline`. The roadmap step that sets up Phaser will pick.

## Versions to pin (suggested)

```jsonc
{
  "dependencies": {
    "vue": "^3.5.0",
    "pinia": "^2.2.0",
    "phaser": "^3.80.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.1.0",
    "typescript": "^5.4.0",
    "vite": "^5.4.0",
    "vue-tsc": "^2.0.0"
  }
}
```

Bump on first install — these are minimums.

## Vite configuration essentials

The base path must match the GitHub Pages URL. The output goes to `docs/`.

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const repoName = 'eye-vision-simulator'; // change to actual repo

export default defineConfig({
  plugins: [vue()],
  base: `/${repoName}/`,
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    assetsInlineLimit: 0, // don't inline shader files
  },
  assetsInclude: ['**/*.glsl', '**/*.frag.glsl', '**/*.vert.glsl'],
});
```

GLSL files are imported as strings with the `?raw` suffix:

```ts
import fragSrc from './shaders/blur.frag.glsl?raw';
```

## Path aliases

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Mirror this in `vite.config.ts` via `resolve.alias`.

## No build pipeline beyond Vite

The user explicitly opted out of CI/CD. We commit the `docs/` folder and point GH Pages at it. That's it.

If the user later wants automated deploys, the simplest path is the standard GitHub Pages action that builds and publishes; see [`09-mcp-and-tools.md`](./09-mcp-and-tools.md) for a stub. Don't add it preemptively.

## Things deliberately excluded

- **Tailwind / UnoCSS.** Adds bundle weight and a build step for a project with ~30 components. Plain CSS is enough.
- **Vue Router.** This is a single page.
- **Component libraries** (Vuetify, Element Plus, etc.). The UI is small enough to hand-build, and consistency matters more than feature completeness.
- **i18n.** Out of scope.
- **PWA / service workers.** Out of scope.
- **Webcam capture.** Possibly future; not in v1.
