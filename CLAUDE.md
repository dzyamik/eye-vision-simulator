# CLAUDE.md

This file is the entry point for [Claude Code](https://docs.claude.com/en/docs/claude-code) working on this project. Read it first; it tells you where everything is and how to behave.

## 1. What this project is

An interactive web app that displays an image as it would appear through different eye conditions, with per-eye configurability. The user sees the original on top and the impaired version on the bottom; a sidebar holds the controls.

Built with **TypeScript + Vite + Vue 3 + Pinia + Phaser 4**. Builds to `./docs/` for GitHub Pages. Frontend only — no backend, no CI/CD beyond the optional GitHub Pages flow described in the README.

> **Phaser version note:** the original spec was written against Phaser 3. Phaser 4.1 was stable on npm at the time we ran roadmap step 1.2, so we picked v4 — see the rationale in [`dev-docs/02-tech-stack.md`](./dev-docs/02-tech-stack.md). Use Phaser 4's unified Filter system in place of v3's `PostFXPipeline`.

## 2. How to work on this project

Implementation follows the phased roadmap in [`dev-docs/07-roadmap.md`](./dev-docs/07-roadmap.md). **Do not skip ahead.** Each phase has acceptance criteria; finish them before moving on.

When the user (or you) says "start" or "next step", do this:

1. Read the roadmap, find the first unchecked step.
2. Read every doc that step references.
3. Plan briefly (one short paragraph), then implement.
4. After implementing, run `npm run build` (once a build target exists) to verify nothing is broken.
5. Mark the step done by checking the box in `07-roadmap.md`.
6. Stop and summarize what was done. Wait for the user to say continue.

If a step is ambiguous, ask before guessing.

## 3. Where the specs live

All specification documents are in [`dev-docs/`](./dev-docs/). Read them in this order on your first session:

| File                                                            | What's in it                                   |
| --------------------------------------------------------------- | ---------------------------------------------- |
| [`00-overview.md`](./dev-docs/00-overview.md)                   | High-level project goals and constraints       |
| [`01-architecture.md`](./dev-docs/01-architecture.md)           | Modules, data flow, Vue↔Phaser bridge          |
| [`02-tech-stack.md`](./dev-docs/02-tech-stack.md)               | Library choices and why                        |
| [`03-eye-conditions.md`](./dev-docs/03-eye-conditions.md)       | Each condition's parameters and meaning        |
| [`04-shaders-reference.md`](./dev-docs/04-shaders-reference.md) | GLSL implementations and matrices              |
| [`05-ui-ux-design.md`](./dev-docs/05-ui-ux-design.md)           | Component layout, interactions, presets        |
| [`06-state-management.md`](./dev-docs/06-state-management.md)   | Pinia store shapes                             |
| [`07-roadmap.md`](./dev-docs/07-roadmap.md)                     | The plan you execute step-by-step              |
| [`08-coding-standards.md`](./dev-docs/08-coding-standards.md)   | Code style, naming, file layout                |
| [`09-mcp-and-tools.md`](./dev-docs/09-mcp-and-tools.md)         | Recommended MCP servers and Claude Code skills |
| [`10-initial-prompt.md`](./dev-docs/10-initial-prompt.md)       | The prompt the user opens with                 |

## 4. Conventions

These are non-negotiable. Following them keeps the codebase coherent across many small Claude Code sessions.

### File and naming

- Vue components: `PascalCase.vue` (e.g. `EyePanel.vue`).
- Composables: `useThing.ts`, returning a function named `useThing`.
- Pinia stores: `useThingStore`, file `src/stores/thing.ts`.
- Phaser pipelines: `ThingPipeline.ts`, class name matches, in `src/phaser/pipelines/`.
- Raw GLSL: in `src/phaser/shaders/*.frag.glsl` — imported as strings via Vite's `?raw` suffix.
- Constants and enums in `src/constants/` and `src/types/`.

### TypeScript

- `strict: true` in `tsconfig.json`. No `any` without a comment explaining why.
- Use `interface` for object shapes, `type` for unions and utilities.
- Per-eye parameters live in a single canonical type — see [`06-state-management.md`](./dev-docs/06-state-management.md). Do not duplicate it.

### Vue

- Composition API with `<script setup lang="ts">` only. No Options API.
- Components stay under ~150 lines. Split if larger.
- Side effects go in composables, not inline in components.
- Reactivity flows **Pinia → Vue → Phaser**. Phaser never owns canonical state.

### Phaser

- The Phaser game is created once, in a composable (`usePhaser.ts`). Vue owns the canvas mount point.
- Every eye condition is its own Phaser 4 Filter (extends `Phaser.Filters.Filter` / `Phaser.Filters.Controller`, depending on whether it owns its own GLSL). Filters are added/removed on the camera based on which conditions are active. Uniforms update via `watch`ers on the Pinia store.
- Shader source lives in `.frag.glsl` files, never inline strings inside `.ts` (except for tiny dev helpers).

### Commits

If the user has you commit, use Conventional Commits:
`feat(shader): add cataract glare pipeline`, `fix(store): correct astigmatism axis range`, `docs: clarify mask resolution`.

## 5. Things to avoid

- Do **not** introduce new dependencies without asking. The stack is fixed: Vue, Pinia, Phaser, TypeScript, Vite. Anything else needs justification.
- Do **not** use Tailwind, UI component libraries, or CSS-in-JS frameworks. Plain CSS with variables only.
- Do **not** add a backend, API calls, telemetry, or analytics. This is a 100% client-side app.
- Do **not** write CI/CD pipelines beyond what's in `09-mcp-and-tools.md`. The user explicitly opted out.
- Do **not** put medical advice anywhere. This is an educational simulator; the disclaimer in the README is the limit.
- Do **not** reproduce copyrighted material. Sample images must be either user-provided, public domain, or generated.

## 6. When you finish a session

Leave the working tree clean. If you've added new specs, mention them. If a roadmap step is partially done, edit `07-roadmap.md` to note the remaining work, don't pretend it's complete.

## 7. Quick links

- Roadmap: [`dev-docs/07-roadmap.md`](./dev-docs/07-roadmap.md)
- Initial prompt template: [`dev-docs/10-initial-prompt.md`](./dev-docs/10-initial-prompt.md)
- Vue 3 docs: <https://vuejs.org/>
- Pinia docs: <https://pinia.vuejs.org/>
- Phaser 4 Filter system: <https://phaser.io/news/2026/05/phaser-4-filter-system>
- Vite static deploy: <https://vite.dev/guide/static-deploy>
