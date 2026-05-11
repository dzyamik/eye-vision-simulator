# 03 — Eye Conditions Reference

This is the canonical list of conditions the simulator supports, with the parameters each exposes, sensible ranges, and references. Every entry here corresponds to one `PostFXPipeline` and one section in the sidebar.

> **Disclaimer reminder:** these are visual approximations for education. The exact mapping from "real-world severity" (e.g. diopters, decibels of perimetry loss) to slider values is a rough best-effort, documented per-condition below.

## Condition table — quick reference

| ID                    | Display name                     | Group      | Key parameters                        |
| --------------------- | -------------------------------- | ---------- | ------------------------------------- |
| `myopia`              | Myopia (nearsightedness)         | Refractive | strength                              |
| `hyperopia`           | Hyperopia (farsightedness)       | Refractive | strength                              |
| `astigmatism`         | Astigmatism                      | Refractive | magnitude, axis                       |
| `presbyopia`          | Presbyopia                       | Refractive | strength                              |
| `colorVision`         | Color vision deficiency          | Color      | type, severity                        |
| `cataract`            | Cataract                         | Lens       | subtype, cloudiness, yellowing, glare |
| `glaucoma`            | Glaucoma (peripheral loss)       | Field loss | innerRadius, feather, severity        |
| `amd`                 | Age-related macular degeneration | Field loss | scotomaRadius, distortion, falloff    |
| `diabeticRetinopathy` | Diabetic retinopathy             | Field loss | spotCount, spotSize, severity         |
| `retinitisPigmentosa` | Retinitis pigmentosa             | Field loss | tunnelRadius, brightnessLoss          |
| `floaters`            | Floaters                         | Overlay    | count, size, opacity                  |
| `migraineAura`        | Migraine aura                    | Overlay    | radius, position, animationSpeed      |
| `customMask`          | Custom mask                      | Custom     | maskTexture, effect                   |

Every condition also has an `enabled: boolean`. When `false`, the pipeline is detached from the camera entirely.

---

## Refractive errors

### Myopia (nearsightedness)

The eye is too long or the cornea too curved; distant objects appear blurred while near vision is fine.

**Visualization:** uniform Gaussian-style blur.

| Param      | Range     | Default | Meaning                                         |
| ---------- | --------- | ------- | ----------------------------------------------- |
| `enabled`  | bool      | false   |                                                 |
| `strength` | 0.0 – 1.0 | 0.0     | 0 = sharp; 1 = severe blur (~ -6 D and beyond). |

**Implementation notes:** Use a 2-pass separable Gaussian for performance. The blur radius (in pixels) scales with `strength * maxBlurPx` where `maxBlurPx` is e.g. 24. Anti-clamping at the edges via texture-clamp sampling.

### Hyperopia (farsightedness)

Eye too short / lens too flat; near objects appear blurred, distance ok. Visually, the simulator can't really tell the user's eye-to-screen distance, so we treat it as the same blur effect as myopia but flag it differently in the UI for educational clarity.

| Param      | Range     | Default | Meaning         |
| ---------- | --------- | ------- | --------------- |
| `enabled`  | bool      | false   |                 |
| `strength` | 0.0 – 1.0 | 0.0     | Same as myopia. |

### Astigmatism

The cornea is shaped more like a rugby ball than a sphere. Light focuses on multiple planes, causing direction-dependent blur. A vertically-oriented astigmatism blurs vertical lines more than horizontal, and vice versa.

| Param       | Range         | Default | Meaning                             |
| ----------- | ------------- | ------- | ----------------------------------- |
| `enabled`   | bool          | false   |                                     |
| `magnitude` | 0.0 – 1.0     | 0.0     | Strength of directional blur.       |
| `axis`      | 0 – 180 (deg) | 0       | Axis along which blur is strongest. |

**Implementation:** directional Gaussian — kernel weights stretched along the axis vector. A single-pass shader that samples along `vec2(cos(angle), sin(angle))` works fine for moderate radii.

### Presbyopia

Age-related stiffening of the lens; near focus declines. Same trick as hyperopia — show a uniform blur with a different label.

| Param      | Range     | Default | Meaning |
| ---------- | --------- | ------- | ------- |
| `enabled`  | bool      | false   |         |
| `strength` | 0.0 – 1.0 | 0.0     |         |

---

## Color vision deficiency

A single condition with a type-selector, applied as a 3×3 matrix in linear RGB (after sRGB→linear and before linear→sRGB).

| Param      | Range     | Default  | Meaning                                                                                                    |
| ---------- | --------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| `enabled`  | bool      | false    |                                                                                                            |
| `type`     | enum      | `normal` | `protanopia`, `deuteranopia`, `tritanopia`, `achromatopsia`, `protanomaly`, `deuteranomaly`, `tritanomaly` |
| `severity` | 0.0 – 1.0 | 1.0      | Interpolates between identity and the full deficiency matrix.                                              |

The actual matrices live in [`04-shaders-reference.md`](./04-shaders-reference.md). Use the Brettel/Viénot family for protan/deutan, and a published tritan matrix; for "anomaly" variants, the same matrix with `severity < 1`.

**Population stats** (worth surfacing in UI tooltips, not used in code):

- Deuteranomaly: ~5% of males
- Protanomaly: ~1% of males
- Tritanopia: ~0.01%
- Achromatopsia: ~0.003%

---

## Cataracts

Clouding of the lens. There are three common subtypes that look very different:

| Subtype       | Look                                                                                                           |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| `nuclear`     | Hardens and yellows the lens center. Image looks dim, slightly yellow-brown, blue desaturated, mildly blurred. |
| `cortical`    | Spoke-like opacities radiating from the periphery. Creates non-uniform haze and bad glare.                     |
| `subcapsular` | Affects the back of the lens. Severe glare, halos around bright lights, near vision worse than distance.       |

**Parameters (one set, modulated by subtype):**

| Param            | Range | Default   | Meaning                                              |
| ---------------- | ----- | --------- | ---------------------------------------------------- |
| `enabled`        | bool  | false     |                                                      |
| `subtype`        | enum  | `nuclear` |                                                      |
| `cloudiness`     | 0 – 1 | 0         | White-haze overlay opacity.                          |
| `yellowing`      | 0 – 1 | 0         | Shifts white point toward yellow, desaturates blues. |
| `brightnessLoss` | 0 – 1 | 0         | Multiplicative dimming.                              |
| `glare`          | 0 – 1 | 0         | Bloom around highlights.                             |

When `subtype` is selected, the UI pre-sets the four parameters to typical values for that subtype but lets the user override.

---

## Glaucoma

Damages the optic nerve; classically presents as **peripheral vision loss** progressing inward ("tunnel vision"). Real glaucoma is rarely a perfect circular vignette — it tends to start with arcuate scotomas in the upper or lower hemifield. v1 ships with a simple radial model; advanced users can use the custom mask for arcuate patterns.

| Param         | Range   | Default | Meaning                                                                                 |
| ------------- | ------- | ------- | --------------------------------------------------------------------------------------- |
| `enabled`     | bool    | false   |                                                                                         |
| `innerRadius` | 0 – 0.7 | 0.7     | Normalized radius (relative to half min(canvas dims)) inside which vision is preserved. |
| `feather`     | 0 – 0.3 | 0.1     | Width of the gradient from clear to dark.                                               |
| `severity`    | 0 – 1   | 1.0     | How dark the periphery gets (1 = black, 0.3 = dim).                                     |

---

## Age-related macular degeneration (AMD)

Damages the macula → **central vision loss**. Two flavors:

- **Dry AMD:** gradual blur and fade in the center.
- **Wet AMD:** straight lines bend (metamorphopsia), often with a central scotoma.

| Param           | Range   | Default | Meaning                                                               |
| --------------- | ------- | ------- | --------------------------------------------------------------------- |
| `enabled`       | bool    | false   |                                                                       |
| `scotomaRadius` | 0 – 0.5 | 0       | Normalized radius of the dark central spot.                           |
| `falloff`       | 0 – 0.3 | 0.1     | Gradient softness around the scotoma.                                 |
| `distortion`    | 0 – 1   | 0       | Adds a noise-based UV warp around the central area (the wavy effect). |

---

## Diabetic retinopathy

Damages retinal blood vessels; creates patchy dark spots in the visual field plus general haziness.

| Param       | Range       | Default | Meaning                       |
| ----------- | ----------- | ------- | ----------------------------- |
| `enabled`   | bool        | false   |                               |
| `spotCount` | 0 – 40      | 0       | Number of dark spots.         |
| `spotSize`  | 0.01 – 0.15 | 0.05    | Avg spot radius (normalized). |
| `severity`  | 0 – 1       | 0       | Overall opacity multiplier.   |

**Implementation:** generate `spotCount` pseudo-random `(x, y, r)` triplets in CPU on parameter change (seeded RNG so it's stable), upload as a uniform array (or texture for >32 spots). Shader does distance test per spot.

---

## Retinitis pigmentosa

Genetic; severe peripheral loss + night blindness. Tunnel vision plus reduced overall brightness.

| Param            | Range   | Default | Meaning                                               |
| ---------------- | ------- | ------- | ----------------------------------------------------- |
| `enabled`        | bool    | false   |                                                       |
| `tunnelRadius`   | 0 – 0.5 | 0.3     | Smaller than glaucoma's typical range.                |
| `feather`        | 0 – 0.2 | 0.05    |                                                       |
| `brightnessLoss` | 0 – 0.7 | 0.3     | Multiplicative dimming inside the visible region too. |

Essentially a more severe glaucoma + a brightness term. Implemented separately because users will look for it by name.

---

## Floaters

Specks/strands inside the vitreous; cast moving shadows.

| Param     | Range        | Default | Meaning                 |
| --------- | ------------ | ------- | ----------------------- |
| `enabled` | bool         | false   |                         |
| `count`   | 0 – 20       | 0       |                         |
| `size`    | 0.005 – 0.05 | 0.02    | Avg radius.             |
| `opacity` | 0 – 1        | 0.5     |                         |
| `animate` | bool         | true    | Drift slowly with time. |

**Implementation:** As Phaser sprites, not a shader. Drift slowly with `time + sin(time)*amplitude` for organic motion.

---

## Migraine aura

Optional/playful. Zigzag scotoma that drifts across the visual field over 15–30 minutes. v1 ships a static "aura is here right now" version.

| Param      | Range      | Default    | Meaning                   |
| ---------- | ---------- | ---------- | ------------------------- |
| `enabled`  | bool       | false      |                           |
| `radius`   | 0.05 – 0.3 | 0.15       | Size of the auric region. |
| `position` | vec2       | (0.5, 0.5) | Center.                   |
| `animate`  | bool       | true       | Slow outward drift.       |

---

## Custom mask (localized scotomas)

The escape hatch. The user paints onto a per-eye canvas; the painted alpha becomes a mask texture passed to a shader that **applies the chosen effect only inside the painted region**.

| Param         | Range     | Default  | Meaning                                           |
| ------------- | --------- | -------- | ------------------------------------------------- |
| `enabled`     | bool      | false    |                                                   |
| `maskTexture` | ImageData | empty    | The painted alpha mask.                           |
| `effect`      | enum      | `darken` | `darken` (v1), `blur` (v1.1), `desaturate` (v1.1) |
| `intensity`   | 0 – 1     | 1        | How strongly the effect applies.                  |

The mask is drawn on a small canvas in the sidebar that previews the image faintly underneath, so the user can paint exactly where they want the scotoma. See [`05-ui-ux-design.md`](./05-ui-ux-design.md) for the mask drawing UX.

---

## Pipeline stacking order

The order matters. Render is left-to-right:

1. **Color vision** — operates on color; should come first so subsequent effects don't muddy the matrix math.
2. **Cataract** — modifies brightness/color/haze, including blur if `glare > 0`.
3. **Refractive** (myopia/hyperopia/presbyopia/astigmatism) — applies blur.
4. **AMD distortion** — UV warps.
5. **Custom mask** — local effect.
6. **Glaucoma / RP / AMD scotoma** — field losses (vignettes and dark centers).
7. **Diabetic retinopathy** — dark spots.
8. **Floaters** — sprite overlay (in front of everything).
9. **Migraine aura** — sprite/shader overlay (very front).

Document this in `pipelineManager.ts` as a constant array, with the per-condition `enabled` check controlling which actually attach.

---

## References used to derive parameters

- BionicHaos Vision Impairment Simulator — parameter ranges and behavior validation.
- Specialty Vision's progression stages (mild/moderate/severe/very severe).
- Richmond Eye Associates simulations — visual references for each condition.
- Brettel, Viénot, Mollon (1997, 1999) — color vision deficiency math.
- Machado et al. — physiological color deficiency model.
- OpenVisSim (Nature Digital Medicine, 2020) — multi-condition VR simulator.
- libDaltonLens — open-source CVD reference.

Citations live in the README's "Acknowledgements" section once the project ships.
