// Migraine aura — a single overlay sprite of the procedural fortification-
// spectrum texture (seeded in VisionScene.ensureMigraineAuraTexture).
// Position comes from positionX/Y in normalised UV; radius scales the
// sprite. Additive blend so the aura adds shimmer over the underlying
// scene rather than darkening it.
//
// `animate` toggles a scale pulse (1.0 → 1.15 yoyo at ~4 s) — the spec's
// "slow outward drift over 15-30 minutes" is a v1.1 enhancement; the
// breathing pulse is a recognisable v1 motion that stays inside the visible
// area. Respects prefers-reduced-motion: if the user prefers reduced
// motion, the tween never starts even when animate is on.

import Phaser from 'phaser';

const TEXTURE_KEY = 'migraine-aura';
const ACTIVE_THRESHOLD = 0.005;
// Texture is 128×128 with the ring centred at radius=45 (texel units).
// Sprite scale × half-texture-size = pixel radius. radius is in normalised
// canvas units (0.05..0.3), so multiply by min(camW, camH).
const TEXTURE_HALF = 64;

interface AuraParams {
  leftActive: boolean;
  leftRadius: number;
  leftPositionX: number;
  leftPositionY: number;
  leftAnimate: boolean;
  rightActive: boolean;
  rightRadius: number;
  rightPositionX: number;
  rightPositionY: number;
  rightAnimate: boolean;
}

let sprite: Phaser.GameObjects.Image | null = null;
let tween: Phaser.Tweens.Tween | null = null;
let lastBaseScale = -1;

const reducedMotionQuery =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

function prefersReducedMotion(): boolean {
  return reducedMotionQuery?.matches ?? false;
}

function stopTween(): void {
  if (tween !== null) {
    tween.stop();
    tween.remove();
    tween = null;
  }
}

function startTween(scene: Phaser.Scene, baseScale: number): void {
  if (sprite === null) return;
  stopTween();
  tween = scene.tweens.add({
    targets: sprite,
    scale: { from: baseScale, to: baseScale * 1.15 },
    duration: 4000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}

export function syncMigraineAura(scene: Phaser.Scene, params: AuraParams): void {
  const anyActive = params.leftActive || params.rightActive;
  // Phase 6 averages both eyes for the camera-wide pass. Phase 7's view
  // modes will let each eye place its own aura.
  const radius = (params.leftRadius + params.rightRadius) / 2;
  const x = (params.leftPositionX + params.rightPositionX) / 2;
  const y = (params.leftPositionY + params.rightPositionY) / 2;
  const animateAny =
    (params.leftActive && params.leftAnimate) ||
    (params.rightActive && params.rightAnimate);
  const effective = anyActive && radius > ACTIVE_THRESHOLD;

  if (effective) {
    if (sprite === null) {
      sprite = scene.add
        .image(0, 0, TEXTURE_KEY)
        .setDepth(110)
        .setOrigin(0.5)
        .setBlendMode(Phaser.BlendModes.ADD);
    }
    const cam = scene.cameras.main;
    const targetPixelRadius = radius * Math.min(cam.width, cam.height);
    const baseScale = targetPixelRadius / TEXTURE_HALF;
    sprite.setPosition(x * cam.width, y * cam.height);

    const shouldAnimate = animateAny && !prefersReducedMotion();
    const scaleChanged = baseScale !== lastBaseScale;
    if (shouldAnimate) {
      if (tween === null || scaleChanged) startTween(scene, baseScale);
    } else {
      stopTween();
      sprite.setScale(baseScale);
    }
    lastBaseScale = baseScale;
  } else {
    stopTween();
    if (sprite !== null) {
      sprite.destroy();
      sprite = null;
    }
    lastBaseScale = -1;
  }
}

export function disposeMigraineAura(): void {
  stopTween();
  if (sprite !== null) {
    sprite.destroy();
    sprite = null;
  }
  lastBaseScale = -1;
}
