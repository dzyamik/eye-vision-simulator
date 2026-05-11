# Eye Vision Simulator

An interactive web app that visualizes how the world looks through different visual impairments. Pick an image (or upload your own), tweak per-eye parameters in the sidebar, and the bottom canvas updates in real time to show the simulated result next to the original.

> **Status:** v1 feature-complete. All 12 eye conditions render via Phaser 4 camera filters, with per-eye independent settings, sync mode, four view modes (both / left / right / split), built-in presets, JSON export/import (mask included), painted custom scotomas, and the standard error / empty / WebGL-unsupported states. See [`dev-docs/07-roadmap.md`](./dev-docs/07-roadmap.md) for the full work log.

## What it simulates

Each eye is configured independently. Supported conditions:

- **Refractive errors** — myopia, hyperopia, astigmatism (with axis dial), presbyopia
- **Color vision deficiencies** — protanopia, deuteranopia, tritanopia, achromatopsia (plus anomalous "weak" variants), with severity slider
- **Cataracts** — nuclear (yellowing), cortical (cloudiness), posterior subcapsular (subtype presets); v1 ships yellowing + brightness loss + cloudiness, glare deferred
- **Glaucoma** — peripheral vision loss / tunnel vision with adjustable radius
- **Macular degeneration** — central scotoma with optional metamorphopsia (wavy distortion)
- **Diabetic retinopathy** — scattered dark spots and patchy field loss (seeded RNG positions)
- **Retinitis pigmentosa** — severe peripheral loss with brightness reduction
- **Floaters and migraine aura** — animated sprite overlays (respect `prefers-reduced-motion`)
- **Custom localized scotomas** — paint blind spots directly onto a per-eye 512×512 mask canvas; v1 effect is `darken`

For each condition, parameters are continuous (sliders) so you can move from a clear eye to severe impairment and watch the change.

## UI layout

```
┌────────────────────────────────────┬───────────────────┐
│  Original image (top half)         │  ☑ Sync both eyes │
│  ────────────────────────────────  │  L [Reset] [Copy] │
│  Impaired view (bottom half)       │  R [Reset] [Copy] │
│   • Phaser/WebGL canvas            │                   │
│   • Updates in real time           │  Presets          │
│   • View-mode toggle (both/L/R/    │   • six built-in  │
│     side-by-side)                  │   • Export / Imp. │
│                                    │                   │
│                                    │  ▾ Refractive     │
│                                    │  ▸ Colour vision  │
│                                    │  ▸ Cataract       │
│                                    │  ▸ Field loss     │
│                                    │  ▸ Overlays       │
│                                    │  ▸ Custom mask    │
└────────────────────────────────────┴───────────────────┘
```

Each condition panel has a per-eye `L` and `R` enabled checkbox; sliders below show two rows (one per eye). The **Sync both eyes** toggle at the top of the sidebar mirrors writes across L ↔ R.

## Tech stack

| Layer        | Choice                                                    |
| ------------ | --------------------------------------------------------- |
| Language     | TypeScript (strict)                                       |
| Build tool   | Vite (output to `docs/` for GitHub Pages)                 |
| UI framework | Vue 3 (Composition API, `<script setup>`)                 |
| State        | Pinia                                                     |
| Rendering    | Phaser 4 with the unified Filter system                   |
| Tests        | Vitest                                                    |
| Lint/format  | ESLint + Prettier                                         |
| Styling      | Plain CSS / CSS variables (no Tailwind — keep deps light) |

See [`dev-docs/02-tech-stack.md`](./dev-docs/02-tech-stack.md) for the full rationale, and [`CLAUDE.md`](./CLAUDE.md) for the Phaser-3 → Phaser-4 decision.

## Getting started

```bash
# Install
npm install

# Run dev server (http://localhost:5173/)
npm run dev

# Build to ./docs for GitHub Pages
npm run build

# Preview the production build locally (http://localhost:4173/)
npm run preview

# Lint / format / test
npm run lint
npm run format
npm run test         # watch mode
npm run test:run     # single-shot
```

## Deploying to GitHub Pages

1. `npm run build` writes the production bundle to `docs/`.
2. Commit and push `docs/` along with the rest of the change.
3. In the repo settings → **Pages**, set:
   - **Source:** Deploy from a branch
   - **Branch:** `main` / `/docs`
4. The site goes live at `https://<user>.github.io/<repo>/`.

`vite.config.ts` uses `base: './'`, so the built assets reference each
other with relative paths. The same `docs/` build serves correctly from
any subdirectory (`https://example.com/some/sub/path/`), from
`file://`, or from a CDN — no rebuild needed when the deployment path
changes.

## Project structure

```
.
├── README.md                  ← you are here
├── CLAUDE.md                  ← Claude Code project guide
├── .claude/                   ← skills + slash commands for Claude Code
├── dev-docs/                  ← detailed specification documents
├── src/
│   ├── main.ts                ← Vue + Pinia bootstrap
│   ├── App.vue
│   ├── components/            ← layout, viewer, sidebar
│   ├── composables/           ← usePhaser, useEyeParam, useMaskCanvas
│   ├── stores/                ← eyeSettings, viewSettings, image, presets, toast
│   ├── phaser/
│   │   ├── createGame.ts
│   │   ├── VisionScene.ts
│   │   ├── pipelineManager.ts ← single broker between Pinia and the camera filter stack
│   │   └── pipelines/         ← one adapter per condition
│   ├── constants/             ← ranges, colour matrices, built-in presets
│   ├── types/                 ← canonical EyeSettings interface
│   └── utils/                 ← deepClone, image helpers
├── public/samples/            ← bundled sample images + manifest
├── docs/                      ← build output (committed for GH Pages)
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Educational disclaimer

This tool is a **simulation for learning and empathy-building purposes only**. The visuals are best-effort approximations based on published research; they are not medical diagnoses, not personalized to any real patient, and not a substitute for an eye care professional. Real vision impairments are heterogeneous, evolve over time, and involve neurological compensations that can't be captured on a screen.

(The same notice appears as a one-time dismissible banner inside the app.)

## Sample image credits

The bundled sample images in `public/samples/` are sourced from Wikimedia Commons:

| Image                    | Author                 | License                                                                                                       |
| ------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| `nordic-house.jpg`       | Boereck                | [Public domain](https://commons.wikimedia.org/wiki/File:Nordisches_Einfamilienhaus.jpg)                       |
| `pompei-sidewalk.jpg`    | Tanya Dedyukhina       | [CC BY 3.0](https://commons.wikimedia.org/wiki/File:Pompei_-_panoramio_(26).jpg)                              |
| `prairie-clouds.jpg`     | Wing-Chi Poon          | [CC BY-SA 2.5](https://commons.wikimedia.org/wiki/File:Cumulus_Clouds_over_Yellow_Prairie2.jpg)               |
| `crosswalk.jpg`          | Alex Proimos           | [CC BY 2.0](https://commons.wikimedia.org/wiki/File:CrossWalk_(5465840138).jpg)                               |

Each image was resized to 1280 px wide; the originals are linked above.

## License

The application code is MIT. Bundled sample images retain their original licenses (see above) — attribution and any share-alike obligations apply to the images themselves, not to derivative software.
