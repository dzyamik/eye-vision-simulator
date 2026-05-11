// Offscreen paint canvas used by the per-eye scotoma editor (MaskPanel,
// Phase 8.2). Manages an HTMLCanvasElement at a fixed working resolution
// and exposes brush strokes via paintAt + a snapshot via getImageData.
//
// Each call returns a fresh instance (no module-level state) so MaskPanel
// can hold two — one per eye — without juggling identifiers. Debouncing
// the ImageData reads is the consumer's job; this composable just hands
// back the current canvas pixels on demand.

export type PaintMode = 'paint' | 'erase';

export interface MaskCanvas {
  /** The underlying canvas. Read-only from the consumer's perspective —
   *  use the methods below to mutate. Useful for debugging (drawImage'ing
   *  it into a visible preview) or for piping straight into a WebGL
   *  texture without an ImageData round-trip. */
  readonly canvas: HTMLCanvasElement;
  /** Stamps a soft-edged brush dot. All coordinates and sizes are
   *  normalised [0, 1] across the canvas. `hardness` 0..1 controls the
   *  inner-to-outer radius ratio of the radial-gradient brush
   *  (0 = fully feathered, 1 = hard edge). */
  paintAt(x: number, y: number, size: number, hardness: number, mode: PaintMode): void;
  /** Erases the whole canvas. */
  clear(): void;
  /** Snapshot of the current canvas as ImageData. Returns null if the 2d
   *  context couldn't be obtained (e.g. in a server-render context — the
   *  composable is browser-only, but caller may forget). */
  getImageData(): ImageData | null;
}

/** Fixed working resolution. 512×512 is plenty for a per-eye scotoma —
 *  the WebGL filter samples bilinearly so even modest detail looks fine
 *  when scaled to the camera. Keeps memory + ImageData transfer cheap. */
const MASK_SIZE = 512;

export function useMaskCanvas(): MaskCanvas {
  const canvas = document.createElement('canvas');
  canvas.width = MASK_SIZE;
  canvas.height = MASK_SIZE;
  const ctx = canvas.getContext('2d');

  function paintAt(
    x: number,
    y: number,
    size: number,
    hardness: number,
    mode: PaintMode,
  ): void {
    if (ctx === null) return;
    const cx = x * canvas.width;
    const cy = y * canvas.height;
    const outerR = Math.max(1, size * canvas.width);
    // Clamp hardness so the inner radius never equals outerR (would make
    // createRadialGradient degenerate) and never goes below 0.
    const safeHardness = Math.max(0, Math.min(0.95, hardness));
    const innerR = outerR * safeHardness;
    ctx.globalCompositeOperation = mode === 'erase' ? 'destination-out' : 'source-over';
    const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.fill();
    // Restore default so a subsequent unrelated draw isn't accidentally
    // an erase.
    ctx.globalCompositeOperation = 'source-over';
  }

  function clear(): void {
    if (ctx === null) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function getImageData(): ImageData | null {
    if (ctx === null) return null;
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  return { canvas, paintAt, clear, getImageData };
}
