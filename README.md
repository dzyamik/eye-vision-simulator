# Eye Vision Simulator

An interactive web app that visualizes how the world looks through different visual impairments. Pick an image (or upload your own), tweak per-eye parameters in the sidebar, and the bottom canvas updates in real time to show the simulated result next to the original.

> **Status:** Specification phase. Implementation is driven by [Claude Code](https://docs.claude.com/en/docs/claude-code) following [`dev-docs/07-roadmap.md`](./dev-docs/07-roadmap.md).

## What it simulates

Each eye is configured independently. Supported conditions:

- **Refractive errors** — myopia, hyperopia, astigmatism (with axis), presbyopia
- **Color vision deficiencies** — protanopia, deuteranopia, tritanopia, achromatopsia (plus anomalous "weak" variants), with severity slider
- **Cataracts** — nuclear (yellowing), cortical (spoke patterns), posterior subcapsular (glare/halos)
- **Glaucoma** — peripheral vision loss / tunnel vision with adjustable radius and feather
- **Macular degeneration** — central scotoma with optional metamorphopsia (wavy distortion)
- **Diabetic retinopathy** — scattered dark spots and patchy field loss
- **Retinitis pigmentosa** — severe peripheral loss with brightness reduction
- **Floaters and migraine aura** — optional overlays
- **Custom localized scotomas** — paint blind spots directly onto a per-eye mask canvas

For each condition, parameters are continuous (sliders) so you can move from a clear eye to severe impairment and watch the change.

## UI layout

```
┌────────────────────────────────────┬───────────────────┐
│  Original image (top half)         │                   │
│  ────────────────────────────────  │   Sidebar         │
│  Impaired view (bottom half)       │   • Eye selector  │
│   • Phaser/WebGL canvas            │   • Condition     │
│   • Updates in real time           │     panels        │
│                                    │   • Per-eye mask  │
│                                    │     drawing       │
│                                    │   • Presets       │
└────────────────────────────────────┴───────────────────┘
```

Use the **eye selector** in the sidebar to toggle which eye's settings you're editing (Left / Right / Both). The bottom view itself can be switched between "both eyes blended", "left only", "right only", and "side-by-side" via a small toolbar above it.

## Tech stack

| Layer        | Choice                                                    |
| ------------ | --------------------------------------------------------- |
| Language     | TypeScript                                                |
| Build tool   | Vite (output to `docs/` for GitHub Pages)                 |
| UI framework | Vue 3 (Composition API, `<script setup>`)                 |
| State        | Pinia                                                     |
| Rendering    | Phaser 3 with custom `PostFXPipeline` shaders             |
| Styling      | Plain CSS / CSS variables (no Tailwind — keep deps light) |

See [`dev-docs/02-tech-stack.md`](./dev-docs/02-tech-stack.md) for the full rationale.

## Getting started (after implementation)

```bash
# Install
npm install

# Run dev server
npm run dev

# Build to ./docs for GitHub Pages
npm run build

# Preview the production build locally
npm run preview
```

## Deploying to GitHub Pages

1. Push the `docs/` folder to `main` (it's the build output — commit it).
2. In the repo settings → **Pages**, set:
   - **Source:** Deploy from a branch
   - **Branch:** `main` / `/docs`
3. The site goes live at `https://<user>.github.io/<repo>/`.

The `base` path in `vite.config.ts` must match `/<repo>/` so assets resolve correctly.

## Project structure

```
.
├── README.md                  ← you are here
├── CLAUDE.md                  ← Claude Code project guide
├── .claude/                   ← skills + slash commands for Claude Code
├── dev-docs/                  ← detailed specification documents
├── src/                       ← (created during implementation)
├── public/                    ← (created during implementation)
├── docs/                      ← (build output, committed for GH Pages)
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Educational disclaimer

This tool is a **simulation for learning and empathy-building purposes only**. The visuals are best-effort approximations based on published research; they are not medical diagnoses, not personalized to any real patient, and not a substitute for an eye care professional. Real vision impairments are heterogeneous, evolve over time, and involve neurological compensations that can't be captured on a screen.

## License

MIT.
