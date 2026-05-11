// Single Phaser scene that holds one Sprite of the current source image.
// Filters/pipelines (Phase 6) attach to this scene's main camera; the sprite
// itself stays a single, plain Image throughout the project's lifetime.
//
// setImage() is safe to call before the scene's create() has fired — the
// request is queued and applied on create. Old textures are removed from
// Phaser's TextureManager when a new image takes over so we don't leak GPU
// memory across image swaps.

import Phaser from 'phaser';

export class VisionScene extends Phaser.Scene {
  static readonly KEY = 'VisionScene';

  /** Resolves when create() has run. The promise is constructed synchronously
   *  in the scene's constructor, so usePhaser can hand it to callers
   *  immediately without touching Phaser's not-yet-booted scene plugins
   *  (`scene.events` is only available after Phaser initialises the scene). */
  readonly ready: Promise<void>;
  private resolveReady!: () => void;

  private sprite: Phaser.GameObjects.Image | null = null;
  private currentTextureKey: string | null = null;
  private pendingSrc: string | null = null;
  private isReady = false;
  private nextKeyId = 0;

  /** Extra cameras for the split view. Each occupies one half of the canvas
   *  and renders the same scene (the image sprite) with its own filter list.
   *  Created in create(); idle (zero viewport) until setSplitMode(true). */
  leftSplitCamera: Phaser.Cameras.Scene2D.Camera | null = null;
  rightSplitCamera: Phaser.Cameras.Scene2D.Camera | null = null;
  private splitActive = false;

  constructor() {
    super({ key: VisionScene.KEY });
    this.ready = new Promise<void>((resolve) => {
      this.resolveReady = resolve;
    });
  }

  create(): void {
    this.isReady = true;
    this.scale.on('resize', this.onResize, this);
    this.ensureCataractNoise();
    this.ensureFloaterTexture();
    this.ensureMigraineAuraTexture();
    // Add split cameras alongside main. Initially idle (0×0 viewport).
    this.leftSplitCamera = this.cameras.add(0, 0, 0, 0);
    this.rightSplitCamera = this.cameras.add(0, 0, 0, 0);
    if (this.pendingSrc !== null) {
      const src = this.pendingSrc;
      this.pendingSrc = null;
      this.setImage(src);
    }
    this.resolveReady();
  }

  /** Toggle between single-camera and split-camera rendering. In split mode
   *  main is hidden (viewport collapsed), split cameras take half each, and
   *  the sprite is refit to half-width so each side shows the full image.
   *  pipelineManager calls this whenever viewMode changes. */
  setSplitMode(enabled: boolean): void {
    if (this.leftSplitCamera === null || this.rightSplitCamera === null) return;
    this.splitActive = enabled;
    const main = this.cameras.main;
    if (enabled) {
      const halfW = main.width / 2;
      this.leftSplitCamera.setViewport(0, 0, halfW, main.height);
      this.rightSplitCamera.setViewport(halfW, 0, halfW, main.height);
      // Both split cameras look at the same world point (the sprite's
      // centre); each viewport just clips to its own half of the screen.
      this.leftSplitCamera.setScroll(main.width / 2 - halfW / 2, 0);
      this.rightSplitCamera.setScroll(main.width / 2 - halfW / 2, 0);
      main.setVisible(false);
    } else {
      this.leftSplitCamera.setViewport(0, 0, 0, 0);
      this.rightSplitCamera.setViewport(0, 0, 0, 0);
      main.setVisible(true);
    }
    this.fitSprite();
  }

  private onResize(): void {
    this.fitSprite();
    // Re-apply split viewports + scrolls with the new camera dimensions.
    if (this.splitActive) this.setSplitMode(true);
  }

  /** Lazily seeds a 128×128 grayscale-noise texture under 'cataract-noise',
   *  used as the cloud-modulation source by CataractPipeline's Blend filter.
   *  Idempotent — if the scene is re-created (HMR) we keep the existing
   *  texture (or regenerate; here we just skip when present). */
  private ensureCataractNoise(): void {
    const key = 'cataract-noise';
    if (this.textures.exists(key)) return;
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx === null) return;
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      // Range [180, 255] gives a light, low-contrast grain — enough to break
      // up flat tinting without dominating the haze. Math.random is fine;
      // we never need to reproduce this noise.
      const v = (180 + Math.floor(Math.random() * 76)) & 0xff;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    this.textures.addCanvas(key, canvas);
  }

  /** Soft dark radial-gradient blob registered as the 'floater' texture.
   *  Used by FloatersPipeline; one shared texture rendered at varying
   *  scales/rotations/alphas per sprite gives enough visual variety
   *  without bundling multiple assets. */
  private ensureFloaterTexture(): void {
    const key = 'floater';
    if (this.textures.exists(key)) return;
    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx === null) return;
    const cx = size / 2;
    const cy = size / 2;
    const grad = ctx.createRadialGradient(cx, cy, size * 0.1, cx, cy, size * 0.5);
    grad.addColorStop(0, 'rgba(15, 17, 21, 1)');
    grad.addColorStop(0.6, 'rgba(15, 17, 21, 0.5)');
    grad.addColorStop(1, 'rgba(15, 17, 21, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    this.textures.addCanvas(key, canvas);
  }

  /** Procedural migraine-aura overlay: a partial-ring fortification
   *  spectrum (C-shape with a gap on the right) with a jagged, shimmery
   *  zigzag pattern modulated by angle. Pixels are bright cyan-white;
   *  the alpha falls off at the band edges so a softer halo bleeds.
   *  Rendered with ADD blend mode by MigraineAuraPipeline. */
  private ensureMigraineAuraTexture(): void {
    const key = 'migraine-aura';
    if (this.textures.exists(key)) return;
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx === null) return;
    const img = ctx.createImageData(size, size);
    const cx = size / 2;
    const cy = size / 2;
    const ringRadius = 45;
    const ringWidth = 14;
    // Hide the right side so the result reads as a fortification-spectrum
    // C-shape: angles whose |a| exceeds this cutoff render transparent.
    const OPEN_HALF_WIDTH = (3 * Math.PI) / 4;
    const ZIGZAG_FREQ = 28;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx); // -π..π
        const i = (y * size + x) * 4;
        if (Math.abs(angle) > OPEN_HALF_WIDTH) {
          img.data[i + 3] = 0;
          continue;
        }
        const distFromRing = Math.abs(dist - ringRadius);
        if (distFromRing > ringWidth) {
          img.data[i + 3] = 0;
          continue;
        }
        // Soft radial fade across the ring band.
        const radialFade = 1 - distFromRing / ringWidth;
        // Zigzag/jagged modulation around the ring.
        const zig = 0.5 + 0.5 * Math.sin(angle * ZIGZAG_FREQ);
        const intensity = zig * radialFade;
        img.data[i] = Math.round(200 * intensity);
        img.data[i + 1] = Math.round(240 * intensity);
        img.data[i + 2] = Math.round(255 * intensity);
        img.data[i + 3] = Math.round(255 * intensity);
      }
    }
    ctx.putImageData(img, 0, 0);
    this.textures.addCanvas(key, canvas);
  }

  setImage(src: string): void {
    if (!this.isReady) {
      this.pendingSrc = src;
      return;
    }

    const key = `vision-image-${++this.nextKeyId}`;
    this.load.image(key, src);
    this.load.once(`filecomplete-image-${key}`, () => {
      this.applyTexture(key);
    });
    this.load.once('loaderror', (file: Phaser.Loader.File) => {
      // Phaser's own loader logs the error; we just unblock the next load.
      console.error('VisionScene image load failed:', file.src);
    });
    this.load.start();
  }

  private applyTexture(key: string): void {
    if (this.sprite === null) {
      this.sprite = this.add.image(0, 0, key).setOrigin(0.5);
    } else {
      this.sprite.setTexture(key);
    }
    if (this.currentTextureKey !== null && this.currentTextureKey !== key) {
      this.textures.remove(this.currentTextureKey);
    }
    this.currentTextureKey = key;
    this.fitSprite();
  }

  private fitSprite(): void {
    if (this.sprite === null) return;
    const cam = this.cameras.main;
    const source = this.sprite.texture.getSourceImage() as
      | HTMLImageElement
      | HTMLCanvasElement;
    const sw = source.width;
    const sh = source.height;
    if (sw === 0 || sh === 0) return;
    // In split mode each viewport is half the canvas width, so we fit to
    // half-width to show the whole image on each side. In single-camera
    // modes we fit to full width.
    const fitWidth = this.splitActive ? cam.width / 2 : cam.width;
    const scale = Math.min(fitWidth / sw, cam.height / sh);
    this.sprite.setScale(scale);
    this.sprite.setPosition(cam.width / 2, cam.height / 2);
  }
}
