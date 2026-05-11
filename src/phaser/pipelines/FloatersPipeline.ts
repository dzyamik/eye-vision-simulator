// Floaters are vitreous specks/strands that cast moving shadows across the
// retina. Implemented as Phaser sprites rather than a shader per the spec
// (dev-docs/04-shaders-reference.md §Floaters) — cheaper, easier to animate
// organically, and they naturally pick up some blur from the refractive
// filters when those are active.
//
// Drift: each floater has a tiny velocity in normalised UV per second; we
// integrate it in the scene's update event. Positions wrap at the edges.
// Respects two stop conditions: the per-eye `animate` flag and the
// system-wide prefers-reduced-motion media query.

import Phaser from 'phaser';

const TEXTURE_KEY = 'floater';
// Normalised UV per second — small enough to look like passive vitreous
// drift, not bugs flying around.
const MAX_DRIFT = 0.02;
// Multiplies the size slider (0.005..0.05 normalised radius) to a pixel
// scale relative to a 32×32 texture sampling a min(camW, camH) view.
const SIZE_PIXEL_SCALE = 40;

interface FloaterState {
  sprite: Phaser.GameObjects.Image;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseScale: number;
}

interface FloaterParams {
  leftActive: boolean;
  leftCount: number;
  leftSize: number;
  leftOpacity: number;
  leftAnimate: boolean;
  rightActive: boolean;
  rightCount: number;
  rightSize: number;
  rightOpacity: number;
  rightAnimate: boolean;
}

let floaters: FloaterState[] = [];
let updateListener: ((time: number, delta: number) => void) | null = null;
let listenerScene: Phaser.Scene | null = null;
let animateRuntime = false;

const reducedMotionQuery =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

function prefersReducedMotion(): boolean {
  return reducedMotionQuery?.matches ?? false;
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function spawnSprite(scene: Phaser.Scene): FloaterState {
  const sprite = scene.add
    .image(0, 0, TEXTURE_KEY)
    .setDepth(100)
    .setOrigin(0.5)
    .setRotation(rand(0, Math.PI * 2));
  return {
    sprite,
    x: rand(0.05, 0.95),
    y: rand(0.05, 0.95),
    vx: rand(-MAX_DRIFT, MAX_DRIFT),
    vy: rand(-MAX_DRIFT, MAX_DRIFT),
    baseScale: 1,
  };
}

function reconcileCount(scene: Phaser.Scene, n: number): void {
  while (floaters.length < n) floaters.push(spawnSprite(scene));
  while (floaters.length > n) {
    const f = floaters.pop();
    f?.sprite.destroy();
  }
}

function tick(time: number, delta: number): void {
  if (listenerScene === null || floaters.length === 0) return;
  const cam = listenerScene.cameras.main;
  const moving = animateRuntime && !prefersReducedMotion();
  const dtSec = delta / 1000;
  for (const f of floaters) {
    if (moving) {
      f.x += f.vx * dtSec;
      f.y += f.vy * dtSec;
      // Wrap at the edges so floaters never disappear permanently.
      if (f.x < 0) f.x += 1;
      else if (f.x > 1) f.x -= 1;
      if (f.y < 0) f.y += 1;
      else if (f.y > 1) f.y -= 1;
    }
    f.sprite.setPosition(f.x * cam.width, f.y * cam.height);
  }
  // Silence unused-var lint on `time` without a config tweak.
  void time;
}

function attachUpdate(scene: Phaser.Scene): void {
  if (updateListener !== null) return;
  updateListener = tick;
  listenerScene = scene;
  scene.events.on('update', updateListener);
}

function detachUpdate(): void {
  if (updateListener !== null && listenerScene !== null) {
    listenerScene.events.off('update', updateListener);
  }
  updateListener = null;
  listenerScene = null;
}

export function syncFloaters(
  scene: Phaser.Scene,
  params: FloaterParams,
): void {
  // Average the two eyes for camera-wide rendering (Phase 7 will refactor
  // for view modes).
  const count = Math.round((params.leftCount + params.rightCount) / 2);
  const size = (params.leftSize + params.rightSize) / 2;
  const opacity = (params.leftOpacity + params.rightOpacity) / 2;
  // animate is per-eye; here we ANY-side it. Both eyes' animate set means
  // floaters drift; either eye disabling animate stops drift entirely.
  // OR-of-actives gives the simplest expected behaviour: if any active eye
  // wants motion, we move. Reduced-motion media query overrides further.
  const animateAny =
    (params.leftActive && params.leftAnimate) ||
    (params.rightActive && params.rightAnimate);
  const anyActive = params.leftActive || params.rightActive;
  const effective = anyActive && count > 0 && opacity > 0.005;

  animateRuntime = animateAny;

  if (effective) {
    reconcileCount(scene, count);
    const cam = scene.cameras.main;
    const baseScale = (size * SIZE_PIXEL_SCALE) / Math.min(cam.width, cam.height) *
      Math.min(cam.width, cam.height) / 32;
    for (const f of floaters) {
      f.sprite.setAlpha(opacity);
      f.sprite.setScale(baseScale);
    }
    attachUpdate(scene);
  } else {
    reconcileCount(scene, 0);
    detachUpdate();
  }
}

export function disposeFloaters(): void {
  detachUpdate();
  for (const f of floaters) f.sprite.destroy();
  floaters = [];
}
