// Factory for the single Phaser.Game instance. The game is created once per
// app lifetime (Phase 4.2 wraps this in a usePhaser composable that enforces
// the singleton). RESIZE scale mode plus a backgroundColor matching the dark
// --bg-2 token means any unfilled area looks like the rest of the UI.

import Phaser from 'phaser';

import { VisionScene } from './VisionScene';

export interface GameHandle {
  game: Phaser.Game;
  scene: VisionScene;
  destroy(): void;
}

export function createGame(parent: HTMLElement): GameHandle {
  const scene = new VisionScene();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    transparent: false,
    backgroundColor: '#161922',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene,
  });

  return {
    game,
    scene,
    destroy(): void {
      // `true` removes the canvas DOM node too — the parent div is owned by
      // Vue, so leaving an orphan canvas inside it would survive HMR reloads.
      game.destroy(true);
    },
  };
}
