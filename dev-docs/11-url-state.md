# 11 — Shareable URL state

How the app encodes its state in `window.location.search` so a user can copy the URL and reproduce a configuration on another device. Implemented across roadmap Phase 10.

## The problem we're solving

Two concrete use cases:

- **"Look at this":** a designer screenshares an impairment configuration, then wants to send a link so the other person can poke at it.
- **Bug reports:** "this combination of settings looks weird" — paste the URL, repro is exact.

JSON export already covers full-fidelity round-trip (Phase 9.2). URL state is the cheap path that fits in a chat message.

## Wire format

A single query parameter:

```
?s=<base64url-encoded-json>
```

The decoded JSON has this shape:

```ts
interface UrlState {
  /** Schema version. Bump when the shape changes in a non-additive way. */
  v: number;

  /** useViewSettingsStore.viewMode */
  vm: 'both' | 'left' | 'right' | 'split';

  /** useEyeSettingsStore.linked */
  sync: boolean;

  /** Bundled sample image filename, if a sample is currently shown. Looked
   *  up against useImageStore.sampleImages on decode; if not found (e.g.
   *  the sample was renamed/removed in a later version) the loader skips
   *  the image swap and just applies settings. */
  sample?: string;

  /** Both eyes' full EyeSettings — but with customMask.maskData stripped
   *  (typed-array, too big for a URL). The rest of the customMask config
   *  (enabled / effect / intensity) does travel; only the painted bitmap
   *  doesn't. */
  l: EyeSettingsForUrl;
  r: EyeSettingsForUrl;
}

type EyeSettingsForUrl = Omit<EyeSettings, 'customMask'> & {
  customMask: Omit<EyeSettings['customMask'], 'maskData'>;
};
```

`base64url` is the URL-safe variant (`+` → `-`, `/` → `_`, padding stripped). Encode/decode utilities live in `src/utils/urlState.ts`.

## Why one param, not many

A single `?s=` blob keeps the schema flexible — adding a field just bumps the JSON shape, no URL parser changes. The alternative (one query param per condition: `?myopia=0.4&deuteranomaly=1.0&…`) keeps URLs human-readable but locks the shape to whatever's in the param parser.

For a tool with 12 conditions × per-eye × multiple params each, the per-condition route would be ~60 query params. Already unreadable at that count, and rigid against future additions. Going single-blob.

## What's excluded — and why

- **`customMask.maskData`** — a 512×512 RGBA ImageData, ~1 MB raw / ~50 KB base64 PNG. Too large for a URL (most browsers cap practical URL length at 2-8 KB; many chat apps truncate at less). Painted masks travel through preset JSON export instead (Phase 9.2).
- **Uploaded images** (`image.current.src` when it's a `data:image/…` URL) — same size argument; can be megabytes.
- **`activeEye`** (which eye the sidebar is editing) — UI state, not "what does the impairment look like" state. Doesn't deserve URL space.
- **Sidebar collapse state, info-popover open/closed, brush size in the mask editor** — all transient editor state, not part of "the configuration".

## Migration / forward-compat

The version field gates the decoder.

- **Same version** → decode normally.
- **Older version** → run the appropriate migration up to the current schema. Migrations are pure functions named `migrateV{from}ToV{to}`, called in sequence. Each one knows how to add missing fields with sensible defaults.
- **Newer version** → throw a clear error and surface as a toast. A user with an old build can't faithfully apply a URL from a newer build; suggesting "update the page" is the safer failure mode than guessing.

For new optional fields we don't strictly need to bump the version (decoder fills with `createDefaultEyeSettings()` defaults for anything missing). Bump only on incompatible changes — renamed fields, removed conditions, a different encoding for an existing field.

## Sample-image handling

The sample's `filename` rather than its full `src` is stored, and on decode we look it up against the bundled samples list. This means:

- Round-trip across versions works as long as the filename stays stable.
- If a future version renames or removes a sample, decode falls back to "leave current image as-is" — the impaired view still applies the settings to whatever image is currently loaded.
- Uploaded images can't be carried in the URL (see exclusions). If the URL has no `sample`, the decoder leaves `image.current` untouched.

## How it integrates

- **On app load** (`useUrlSync` composable, Phase 10.2): parse `window.location.search`; if `?s=` is present, decode and apply to `useEyeSettingsStore` + `useViewSettingsStore` (+ `useImageStore.setFromSample` if a known sample matches).
  - Order is load-bearing: `image.loadSampleManifest()` → `applyFromCurrentUrl()` → `image.ensureDefaultImage()`. Doing the default-image step before URL apply (the original implementation) caused two writes to `image.current` and raced two Phaser texture loads, so the impaired view sometimes stuck on the default sample while the original view showed the URL's sample. The split keeps writes to one per launch.
- **On state change**: watch the same stores, debounce ~300 ms, call `history.replaceState` (NOT `pushState` — back button shouldn't accumulate one entry per slider tick) with the new `?s=` value.
- **`Copy link` button** in `TopBar` (Phase 10.3): `navigator.clipboard.writeText(window.location.href)`.
- **`Reset all & clear URL` button** in `EyeActions`: resets both eyes + sync flag + view mode, then calls `clearUrlState()` to strip `?s=` from the address bar. `lastWrittenBlob` is re-synced to the post-reset snapshot so the watcher's next post-tick fire doesn't immediately re-write an equivalent URL; the address bar stays clean until the user meaningfully changes something.

## Size budget (informational)

Empirical: a fully-defaulted UrlState encodes to roughly 1.2 KB of base64. With every condition enabled and tuned, ~1.5–1.8 KB. Most browsers handle 8 KB URLs cleanly. Most chat apps preserve the full URL though some preview-tools truncate at ~2 KB — long URLs may end up clipped in link unfurls but still work when pasted by hand.

If size becomes a problem, the cheapest win is dropping default-valued fields from the encoded JSON before stringify (and filling them back from `createDefaultEyeSettings()` on decode). That's a non-breaking optimisation — it's still schema v1.
