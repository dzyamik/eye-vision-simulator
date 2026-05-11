// Age-related macular degeneration: central dark scotoma + optional
// metamorphopsia (wavy distortion of straight lines). Two stacked filters:
//
//   1. Blend with a procedurally-regenerated radial-gradient CanvasTexture.
//      White (alpha-modulated) at the centre fading to transparent at the
//      edges; tinted black via the Blend filter's color param. The result
//      darkens the centre proportionally to the gradient's alpha.
//
//      The gradient depends on scotomaRadius + falloff, so we rebuild the
//      canvas and call CanvasTexture.refresh() whenever those change. A
//      256×256 redraw is ~5 ms per slider frame — acceptable for drag, and
//      we skip the work entirely when the values haven't changed.
//
//   2. Displacement using the existing 'cataract-noise' texture for the
//      wavy UV warp (metamorphopsia). x/y are scaled by `distortion`.
//
// Both-eye blend: average all params for the camera-wide pass; Phase 7's
// view modes will refactor for per-side rendering.

import Phaser from 'phaser';

const SCOTOMA_TEXTURE_KEY = 'amd-scotoma';
const SCOTOMA_TEXTURE_SIZE = 256;
const ACTIVE_THRESHOLD = 0.005;
// Maximum displacement amount sent to Phaser at distortion=1. Phaser's
// Displacement uses normalised offsets — small numbers move the UV by a
// small fraction of the camera's dimensions. 0.05 = visibly bendy without
// shredding the image.
const MAX_DISPLACEMENT = 0.05;

interface AmdParams {
  leftActive: boolean;
  leftScotomaRadius: number;
  leftFalloff: number;
  leftDistortion: number;
  rightActive: boolean;
  rightScotomaRadius: number;
  rightFalloff: number;
  rightDistortion: number;
}

let scotomaFilter: Phaser.Filters.Blend | null = null;
let displacementFilter: Phaser.Filters.Displacement | null = null;
let lastScotomaRadius = -1;
let lastFalloff = -1;

function ensureScotomaTexture(scene: Phaser.Scene): Phaser.Textures.CanvasTexture {
  const existing = scene.textures.exists(SCOTOMA_TEXTURE_KEY)
    ? (scene.textures.get(SCOTOMA_TEXTURE_KEY) as Phaser.Textures.CanvasTexture)
    : null;
  if (existing !== null) return existing;
  const canvas = document.createElement('canvas');
  canvas.width = SCOTOMA_TEXTURE_SIZE;
  canvas.height = SCOTOMA_TEXTURE_SIZE;
  const created = scene.textures.addCanvas(SCOTOMA_TEXTURE_KEY, canvas);
  // addCanvas returns CanvasTexture | null; on failure we'd have already
  // thrown above. Cast safely.
  return created as Phaser.Textures.CanvasTexture;
}

function drawScotoma(
  canvasTexture: Phaser.Textures.CanvasTexture,
  scotomaRadius: number,
  falloff: number,
): void {
  const canvas = canvasTexture.canvas;
  const ctx = canvas.getContext('2d');
  if (ctx === null) return;
  const size = canvas.width;
  const half = size / 2;
  // Scale distance so the texture's edge midpoint corresponds to "0.5
  // radius from camera centre" (matches the slider's 0..0.5 range).
  const img = ctx.createImageData(size, size);
  const safeFalloff = Math.max(falloff, 0.001);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - half) / half;
      const dy = (y - half) / half;
      const dist = 0.5 * Math.sqrt(dx * dx + dy * dy);
      const t = (dist - scotomaRadius) / safeFalloff;
      const alpha = Math.max(0, Math.min(1, 1 - t));
      const i = (y * size + x) * 4;
      img.data[i] = 255;
      img.data[i + 1] = 255;
      img.data[i + 2] = 255;
      img.data[i + 3] = Math.round(alpha * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  canvasTexture.refresh();
}

export function syncAmd(
  scene: Phaser.Scene,
  camera: Phaser.Cameras.Scene2D.Camera,
  params: AmdParams,
): void {
  const anyActive = params.leftActive || params.rightActive;
  const scotomaRadius = (params.leftScotomaRadius + params.rightScotomaRadius) / 2;
  const falloff = (params.leftFalloff + params.rightFalloff) / 2;
  const distortion = (params.leftDistortion + params.rightDistortion) / 2;

  const wantsScotoma = anyActive && scotomaRadius > ACTIVE_THRESHOLD;
  const wantsDistortion = anyActive && distortion > ACTIVE_THRESHOLD;

  // --- scotoma (blend filter) ---
  if (wantsScotoma) {
    const tex = ensureScotomaTexture(scene);
    if (scotomaRadius !== lastScotomaRadius || falloff !== lastFalloff) {
      drawScotoma(tex, scotomaRadius, falloff);
      lastScotomaRadius = scotomaRadius;
      lastFalloff = falloff;
    }
    if (scotomaFilter === null) {
      scotomaFilter = camera.filters.internal.addBlend(
        SCOTOMA_TEXTURE_KEY,
        Phaser.BlendModes.NORMAL,
        1,
        [0, 0, 0, 1],
      );
    }
  } else if (scotomaFilter !== null) {
    camera.filters.internal.remove(scotomaFilter);
    scotomaFilter = null;
  }

  // --- distortion (displacement filter) ---
  if (wantsDistortion) {
    if (displacementFilter === null) {
      displacementFilter = camera.filters.internal.addDisplacement(
        'cataract-noise',
        distortion * MAX_DISPLACEMENT,
        distortion * MAX_DISPLACEMENT,
      );
    }
    displacementFilter.x = distortion * MAX_DISPLACEMENT;
    displacementFilter.y = distortion * MAX_DISPLACEMENT;
  } else if (displacementFilter !== null) {
    camera.filters.internal.remove(displacementFilter);
    displacementFilter = null;
  }
}

export function disposeAmd(camera: Phaser.Cameras.Scene2D.Camera): void {
  if (scotomaFilter !== null) {
    camera.filters.internal.remove(scotomaFilter);
    scotomaFilter = null;
  }
  if (displacementFilter !== null) {
    camera.filters.internal.remove(displacementFilter);
    displacementFilter = null;
  }
  lastScotomaRadius = -1;
  lastFalloff = -1;
}
