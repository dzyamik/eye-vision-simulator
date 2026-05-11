# 00 — Overview

## Goal

Build an in-browser, frontend-only **Eye Vision Simulator**. The user picks (or uploads) an image and sees, side by side, how it looks to a healthy eye versus an eye with one or more conditions applied. Each eye (left and right) is configured independently.

This is a tool for **education, design accessibility checks, and empathy-building** — not a medical device.

## Audience

Three rough groups, in priority order:

1. **Designers and developers** checking how UI mockups look with color vision deficiencies or low acuity.
2. **Students, teachers, family members** of people with eye conditions, exploring how a parent or partner sees the world.
3. **Curious users** who want to play with sliders.

The UI should be approachable for group 3 while still giving group 1 enough precision to be useful.

## Constraints

These shape every design decision downstream.

- **Frontend only.** No backend, no APIs, no CI/CD beyond optional GitHub Pages deploy. Everything runs in the browser.
- **GitHub Pages deployment.** Build output goes to `./docs/`. No custom servers, no edge functions.
- **Fixed tech stack.** TypeScript, Vite, Vue 3, Pinia, Phaser 3. No additions without justification.
- **Real-time interactivity.** Slider changes must update the preview within ~16 ms (one frame) on a modern laptop GPU. Implies GPU shaders, not CPU pixel loops.
- **No medical claims.** The simulator approximates. We say so loudly.

## Scope — what's in

- 12+ eye conditions, per-eye, with continuous severity sliders (see [`03-eye-conditions.md`](./03-eye-conditions.md)).
- Per-eye custom mask drawing (paint scotomas onto a canvas).
- Original-vs-impaired side-by-side display.
- Bottom-view modes: both-eyes blended, left only, right only, side-by-side.
- Image upload (drag-drop or file picker) — stays in the browser; no upload to a server.
- A handful of bundled sample images.
- Named presets (e.g. "moderate myopia + early cataract").
- Save/load preset to/from local JSON download.

## Scope — what's out

- No webcam input (could be a future extension).
- No eye tracking / gaze-contingent simulation.
- No animation timeline (sliders are static at any moment).
- No accessibility audit reports / WCAG scoring (could be a future extension).
- No multi-page navigation. Single-page app.
- No user accounts, no cloud storage. Presets are local JSON only.

## Success criteria

The project is "done" (v1.0) when:

1. All conditions in [`03-eye-conditions.md`](./03-eye-conditions.md) render correctly on a 1080p image at 60 fps.
2. Per-eye masks can be drawn, erased, cleared, and saved with the preset.
3. The bundled sample images and at least one user upload work end-to-end.
4. Build to `./docs/` succeeds; the site loads cleanly from a GitHub Pages URL.
5. A first-time user with no instructions can produce a clearly different "impaired" image within 60 seconds.

## Non-goals worth stating

- This isn't a research-grade simulator. It's good enough for a design check, not for psychophysics experiments.
- We're not modeling neural adaptation, eye movement, or binocular rivalry.
- Color matrices are approximations (Brettel/Viénot/Machado family). We document this in the UI.
