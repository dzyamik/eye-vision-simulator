// Diabetic retinopathy — scattered dark spots across the visual field.
// Same Blend-on-procedural-canvas pattern as AMD's scotoma, but with N
// seeded-RNG spot positions instead of one central blob.
//
// Stability rules (the acceptance criterion):
//   - Spot positions are deterministic for a fixed seed, generated once
//     at module load. Changing spotCount only adds/removes from the end
//     of the position list — earlier spots stay put.
//   - Changing spotSize redraws every spot at the new size but at the
//     same positions.
//   - Changing severity is filter-only — no canvas redraw. Severity =
//     Blend amount; spot positions and sizes are unaffected.

import Phaser from 'phaser';

const TEXTURE_KEY = 'diabetic-retinopathy-spots';
const TEXTURE_SIZE = 512;
const MAX_SPOTS = 40; // matches RANGES.diabeticRetinopathy.spotCount.max
const ACTIVE_THRESHOLD = 0.005;
const RNG_SEED = 0x4f4d4c2a; // arbitrary fixed seed

// Tiny PRNG (Mulberry32). Pure JS, deterministic, good enough for spot
// scatter. Source: https://stackoverflow.com/a/47593316/137950
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 0x100000000;
  };
}

// Positions in normalised [0, 1] UV space. Generated once; reused across
// the app's lifetime. Slight inset (0.05..0.95) so spots don't get clipped
// at the canvas edges.
const POSITIONS: ReadonlyArray<readonly [number, number]> = (() => {
  const rng = mulberry32(RNG_SEED);
  const out: Array<[number, number]> = [];
  for (let i = 0; i < MAX_SPOTS; i++) {
    out.push([0.05 + rng() * 0.9, 0.05 + rng() * 0.9]);
  }
  return out;
})();

interface DrParams {
  leftActive: boolean;
  leftSpotCount: number;
  leftSpotSize: number;
  leftSeverity: number;
  rightActive: boolean;
  rightSpotCount: number;
  rightSpotSize: number;
  rightSeverity: number;
}

let filter: Phaser.Filters.Blend | null = null;
let lastSpotCount = -1;
let lastSpotSize = -1;

function ensureTexture(scene: Phaser.Scene): Phaser.Textures.CanvasTexture {
  if (scene.textures.exists(TEXTURE_KEY)) {
    return scene.textures.get(TEXTURE_KEY) as Phaser.Textures.CanvasTexture;
  }
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  return scene.textures.addCanvas(TEXTURE_KEY, canvas) as Phaser.Textures.CanvasTexture;
}

function drawSpots(
  tex: Phaser.Textures.CanvasTexture,
  spotCount: number,
  spotSize: number,
): void {
  const canvas = tex.canvas;
  const ctx = canvas.getContext('2d');
  if (ctx === null) return;
  const size = canvas.width;
  // Fully transparent base — only the spots contribute alpha.
  ctx.clearRect(0, 0, size, size);
  const radiusPx = spotSize * size;
  const n = Math.min(Math.max(0, Math.round(spotCount)), MAX_SPOTS);
  for (let i = 0; i < n; i++) {
    const [u, v] = POSITIONS[i]!;
    const cx = u * size;
    const cy = v * size;
    // Soft-edged radial gradient: opaque centre fading to transparent at
    // the spot's outer radius. Matches the spec shader's
    // 1 - smoothstep(r*0.6, r, d) attenuation profile.
    const grad = ctx.createRadialGradient(cx, cy, radiusPx * 0.6, cx, cy, radiusPx);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - radiusPx, cy - radiusPx, radiusPx * 2, radiusPx * 2);
  }
  tex.refresh();
}

export function syncDiabeticRetinopathy(
  scene: Phaser.Scene,
  camera: Phaser.Cameras.Scene2D.Camera,
  params: DrParams,
): void {
  const anyActive = params.leftActive || params.rightActive;
  const spotCount = Math.round((params.leftSpotCount + params.rightSpotCount) / 2);
  const spotSize = (params.leftSpotSize + params.rightSpotSize) / 2;
  const severity = (params.leftSeverity + params.rightSeverity) / 2;
  const effective = anyActive && spotCount > 0 && severity > ACTIVE_THRESHOLD;

  if (effective) {
    const tex = ensureTexture(scene);
    if (spotCount !== lastSpotCount || spotSize !== lastSpotSize) {
      drawSpots(tex, spotCount, spotSize);
      lastSpotCount = spotCount;
      lastSpotSize = spotSize;
    }
    if (filter === null) {
      filter = camera.filters.internal.addBlend(
        TEXTURE_KEY,
        Phaser.BlendModes.NORMAL,
        severity,
        [0, 0, 0, 1],
      );
    }
    filter.amount = severity;
  } else if (filter !== null) {
    camera.filters.internal.remove(filter);
    filter = null;
  }
}

export function disposeDiabeticRetinopathy(camera: Phaser.Cameras.Scene2D.Camera): void {
  if (filter !== null) {
    camera.filters.internal.remove(filter);
    filter = null;
  }
  lastSpotCount = -1;
  lastSpotSize = -1;
}
