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

  constructor() {
    super({ key: VisionScene.KEY });
    this.ready = new Promise<void>((resolve) => {
      this.resolveReady = resolve;
    });
  }

  create(): void {
    this.isReady = true;
    this.scale.on('resize', this.fitSprite, this);
    this.ensureCataractNoise();
    this.ensureFloaterTexture();
    if (this.pendingSrc !== null) {
      const src = this.pendingSrc;
      this.pendingSrc = null;
      this.setImage(src);
    }
    this.resolveReady();
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
    const scale = Math.min(cam.width / sw, cam.height / sh);
    this.sprite.setScale(scale);
    this.sprite.setPosition(cam.width / 2, cam.height / 2);
  }
}
