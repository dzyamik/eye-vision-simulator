# 05 — UI / UX Design

## Layout

```
┌──────────────────────────────────────────────┬─────────────────────┐
│ TopBar                                       │                     │
│  [Logo]  [Sample images ▾]  [Upload]  [⋯]    │                     │
├──────────────────────────────────────────────┤   Sidebar (320 px)  │
│  Original                                    │                     │
│  ┌────────────────────────────────────────┐  │  Eye selector       │
│  │                                        │  │   [ L | R | Both ]  │
│  │            <img>                       │  │                     │
│  │                                        │  │  ─────────────────  │
│  └────────────────────────────────────────┘  │                     │
│                                              │  ▾ Refractive       │
│  Impaired   [ Both ▾ ]   [ ↻ Reset ]         │     · Myopia        │
│  ┌────────────────────────────────────────┐  │     · Hyperopia     │
│  │                                        │  │     · Astigmatism   │
│  │       <canvas> (Phaser)                │  │     · Presbyopia    │
│  │                                        │  │                     │
│  └────────────────────────────────────────┘  │  ▸ Color vision     │
│                                              │  ▸ Cataract         │
│                                              │  ▸ Field loss       │
│                                              │  ▸ Overlays         │
│                                              │  ▾ Custom mask      │
│                                              │     [canvas]        │
│                                              │                     │
│                                              │  ─────────────────  │
│                                              │  Presets ▾ Save     │
└──────────────────────────────────────────────┴─────────────────────┘
```

- Page max-width: ~1400 px, centered.
- Viewer column flexes; sidebar is fixed-width 320 px on desktop.
- Below 900 px wide: sidebar collapses to a drawer toggled from the top bar.
- Below 600 px wide: viewer stack stays vertical; impaired view sized to viewport.

## Color and type tokens

`src/styles/tokens.css`:

```css
:root {
  --bg: #0f1115;
  --bg-2: #161922;
  --bg-3: #1d212c;
  --fg: #e8eaed;
  --fg-dim: #9aa0a6;
  --accent: #7aa2ff;
  --accent-2: #5b8cff;
  --warn: #f0b84a;
  --danger: #e87070;
  --border: #2a2e3a;

  --radius: 8px;
  --radius-sm: 4px;
  --pad-sm: 8px;
  --pad: 12px;
  --pad-lg: 20px;

  --font-ui: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;
  --t-sm: 12px;
  --t: 14px;
  --t-lg: 16px;
  --t-xl: 20px;
}
```

A light theme can be added in v1.1 by adding a `[data-theme="light"]` block. v1 ships dark only.

## Eye selector

A segmented toggle at the top of the sidebar:

```
┌──────────┬──────────┬──────────┐
│  Left    │  Right   │  Both    │
└──────────┴──────────┴──────────┘
```

- **Left/Right:** Changes which eye's parameters are being edited. The sidebar parameters bind to that eye.
- **Both:** A "link mode" where changing a slider updates both eyes simultaneously.

The current eye is also reflected on the impaired view's mode toggle (so users see at a glance: "I'm editing left eye AND the bottom view is showing the right eye" is a state they can recover from).

A small "Copy → / ←" button copies the active eye's settings to the other.

## Condition group

A collapsible section, default-collapsed except "Refractive errors" on first load. Each group's header shows a count of active conditions in the group, like a small dot or "(2)".

## Condition panel — the smallest unit

```
┌────────────────────────────────────────┐
│ ◯ Myopia                          [?]  │
│  Strength    ●──────────  0.40        │
└────────────────────────────────────────┘
```

- `◯` is a toggle (filled when enabled). Hover shows a tooltip.
- `[?]` opens a small popover with a one-paragraph description (sourced from `03-eye-conditions.md`) and a "Reference image" thumbnail.
- Sliders are HTML `<input type="range">` styled to match tokens. Each slider has a numeric input on the right showing the current value, editable directly.
- Disabled-condition sliders are visible but greyed out and non-interactive.

Special cases:

- **Astigmatism:** axis slider is a circular dial in addition to a numeric input (0–180°). Lets users orient by feel.
- **Color vision:** type is a `<select>`, severity is a slider.
- **Cataract:** subtype is three radio buttons; clicking one updates all four sliders to the preset values (with a brief animation) but doesn't lock them.

## View mode toggle (impaired view header)

```
[ Both ▾ ]   means a dropdown with: Both eyes (blended) / Left eye / Right eye / Side-by-side
[ ↻ Reset ]  resets the currently-shown eye(s) to defaults
```

In side-by-side, a thin labeled divider runs vertically through the canvas.

## Custom mask drawing UX

A separate panel inside the sidebar, expanded by default when "Custom mask" is enabled.

```
┌────────────────────────────────────────┐
│ Custom mask (Left eye)            [?]  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │    [preview image faintly]       │  │
│  │    [paint area on top]           │  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Brush:  ●─────── 24 px                │
│  Hardness: ●──── 0.6                   │
│  Mode: [ Paint ] [ Erase ] [ Clear ]   │
│  Effect: [Darken ▾]                    │
│  Intensity: ●───── 1.0                 │
└────────────────────────────────────────┘
```

- The preview is the current original image, scaled to fit the panel, with low opacity (~0.4). The painted mask sits on top with full opacity.
- Painting uses pointer events (mouse + touch). Single-pointer support is fine for v1.
- The mask resolution internally is e.g. 512×512 regardless of preview size, scaled appropriately.
- Mode `Paint` adds opacity, `Erase` subtracts, `Clear` zeroes the whole canvas (with a confirm).
- The mask is part of the eye's settings and saved with presets.

There's one mask **per eye**. Switching the eye selector switches which mask is shown. A small "Copy mask → other eye" button is offered.

## Image input

- Top bar has an "Upload" button (file picker) and a "Sample images" dropdown.
- The viewer itself accepts drag-drop of an image file anywhere.
- Uploaded images are read with `FileReader.readAsDataURL` and stored in Pinia as a data URL. They never leave the browser.
- Max file size 10 MB (warn + reject above this). Suggest the user resize first if larger.
- Show file dimensions in a small caption under the original view.

## Sample images bundled

A short, deliberately varied list. Public-domain or generated:

- A city street with text (reading test)
- A face / portrait (facial recognition test)
- A nature scene with strong color contrast (color vision test)
- A high-contrast pattern (acuity test)
- A nighttime scene (low-light test)
- A page of text (reading)

Store under `public/samples/` so they're served directly.

## Presets

A preset captures both eyes' full state. Presets live in Pinia (in-memory, with a manual "Export to JSON" / "Import from JSON" button). v1 ships these bundled presets:

- "Mild myopia (both eyes)"
- "Moderate cataract (right eye only)"
- "Deuteranomaly"
- "Advanced glaucoma (peripheral loss)"
- "Wet AMD (central scotoma)"
- "Mixed: mild cataract + presbyopia"

Selecting a preset replaces current settings. A small "Modified" indicator appears when the user has changed anything from the loaded preset.

## Performance and feedback

- Sliders that trigger expensive rebuilds (e.g. `spotCount` in diabetic retinopathy) debounce by ~50 ms.
- A small "Rendering…" pill appears in the impaired view header for >100 ms operations.
- Anything that fails (failed image load, shader compile error) shows a non-blocking toast at the bottom-right.

## Keyboard shortcuts (optional, ship if time permits)

| Key          | Action                                                                              |
| ------------ | ----------------------------------------------------------------------------------- |
| `L`          | Focus Left eye                                                                      |
| `R`          | Focus Right eye                                                                     |
| `B`          | Focus Both eyes                                                                     |
| `Space`      | Toggle the bottom view between "current settings" and "no effects" (compare on/off) |
| `1`–`9`      | Toggle conditions 1–9 in the current group                                          |
| `Ctrl/Cmd+Z` | Undo last parameter change                                                          |

Undo/redo is a stretch goal. If implemented, store the last 50 parameter mutations in a ring buffer in Pinia.

## Accessibility

- All controls reachable by keyboard. Sliders use native `<input type="range">`.
- Color contrast: AA on the default dark theme. Verify with the very simulator we're building (delicious recursion).
- All buttons have `aria-label`. Toggle states use `aria-pressed`.
- The drawing canvas is keyboard-inaccessible by nature, but is non-essential — every condition can be configured without ever touching it.
- Reduced motion: respect `prefers-reduced-motion`. Disable the floaters animation and migraine aura drift.

## Empty / error states

| State                                | Behavior                                                                                                                            |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| No image loaded yet                  | The viewer shows a centered "Drop an image here, or pick a sample →" message. The impaired view stays blank.                        |
| WebGL unavailable                    | Replace the impaired view with a card explaining the limitation and linking to a browser-support page. Sidebar still works (no-op). |
| Image loaded but pipelines not ready | Original visible, impaired shows a centered spinner.                                                                                |
| Mask painting on an empty canvas     | Show faint grid lines so the user knows the canvas is "there".                                                                      |
