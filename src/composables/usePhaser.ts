// Singleton bridge between Vue and the one Phaser game. Holds the GameHandle
// at module scope so any consumer (ImpairedView today; pipelineManager in
// Phase 6) sees the same instance. dispose() resets the singleton so a fresh
// mount after a teardown (HMR, route-change-equivalent) can rebuild cleanly.
//
// gameReady is a promise that settles when the scene's create() has run, so
// callers can defer pipeline attachment / sprite manipulation until Phaser
// is past its async boot.

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

export function usePhaser(parent: HTMLElement): PhaserBridge {
  if (handle === null) {
    handle = createGame(parent);
    gameReady = new Promise<void>((resolve) => {
      handle!.scene.events.once('create', () => resolve());
    });
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
