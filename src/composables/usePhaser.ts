// Singleton bridge between Vue and the one Phaser game. Holds the GameHandle
// at module scope so any consumer (ImpairedView today; pipelineManager in
// Phase 6) sees the same instance. dispose() resets the singleton so a fresh
// mount after a teardown (HMR, route-change-equivalent) can rebuild cleanly.
//
// gameReady is a promise that settles when the scene's create() has run, so
// callers can defer pipeline attachment / sprite manipulation until Phaser
// is past its async boot.
//
// We also wire a ResizeObserver on the parent here. Phaser.Scale.RESIZE
// auto-tracks window resize, but not parent-container reflow (e.g. the
// sidebar drawer toggling on mobile, or the layout grid changing). Without
// the observer the canvas stays at its old size until the user happens to
// resize the window. game.scale.refresh() is RAF-coalesced so a burst of
// resize callbacks (which Chrome can emit during animations) only triggers
// one refresh per frame.

import { createGame, type GameHandle } from '@/phaser/createGame';

interface PhaserBridge {
  setImage(src: string): void;
  dispose(): void;
  gameReady: Promise<void>;
  /** Internal escape hatch — Phase 6 pipelineManager needs the scene to
   *  attach Filters. UI code should stick to setImage. */
  getScene(): GameHandle['scene'] | null;
}

let handle: GameHandle | null = null;
let gameReady: Promise<void> | null = null;
let resizeObserver: ResizeObserver | null = null;
let pendingRaf: number | null = null;

export function usePhaser(parent: HTMLElement): PhaserBridge {
  if (handle === null) {
    handle = createGame(parent);
    // VisionScene constructs `ready` synchronously, so we can just hand it
    // through. (We can't subscribe to scene.events here directly — Phaser
    // hasn't initialised the scene's plugin instances yet at this point.)
    gameReady = handle.scene.ready;

    resizeObserver = new ResizeObserver(() => {
      if (pendingRaf !== null) return;
      pendingRaf = requestAnimationFrame(() => {
        pendingRaf = null;
        handle?.game.scale.refresh();
      });
    });
    resizeObserver.observe(parent);
  }

  // Snapshot the promise at call time. After dispose() we set the module
  // ref to null; existing callers keep the resolved snapshot, which is
  // semantically correct since their Phaser is the one they got handed.
  const ready = gameReady!;

  return {
    setImage(src: string): void {
      handle?.scene.setImage(src);
    },
    dispose(): void {
      resizeObserver?.disconnect();
      resizeObserver = null;
      if (pendingRaf !== null) {
        cancelAnimationFrame(pendingRaf);
        pendingRaf = null;
      }
      handle?.destroy();
      handle = null;
      gameReady = null;
    },
    gameReady: ready,
    getScene(): GameHandle['scene'] | null {
      return handle?.scene ?? null;
    },
  };
}
