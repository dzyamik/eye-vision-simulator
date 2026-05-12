// Astigmatism — directional Gaussian blur along the cylinder axis. Phaser
// 4's built-in Filters.Blur is separable (independent x/y passes), which
// degrades to symmetric 2D blur at oblique angles like 45°. The clinical
// effect is a single-direction smear, so this pipeline ships its own GLSL
// filter (see ./astigmatism.frag.glsl) that samples along (cos θ, sin θ).
//
// Convention (matches dev-docs/04-shaders-reference.md and the JOV
// vision-research literature): axis = direction of sharp focus.
//   axis = 0°   → horizontal kernel → vertical lines blur, horizontal
//                 lines stay sharp (against-the-rule astigmatism).
//   axis = 90°  → vertical kernel   → horizontal lines blur, vertical
//                 lines stay sharp (with-the-rule astigmatism).
//   axis = 45°  → diagonal kernel along the +x/+y diagonal.

import Phaser from 'phaser';

import astigmatismFrag from '@/phaser/shaders/astigmatism.frag.glsl?raw';

const ACTIVE_THRESHOLD = 0.005;
// Max half-kernel radius in pixels at magnitude=1. Matches the
// 04-shaders-reference.md spec value; produces a clearly directional but
// not catastrophic smear at the upper end of the slider (mapped clinically
// to a -3 D cyl, severe).
const MAX_RADIUS_PX = 24;
const RENDER_NODE_NAME = 'FilterAstigmatism';

interface RenderNodeManagerLike {
  hasNode(name: string, constructed?: boolean): boolean;
  addNode(name: string, node: object): void;
}

class AstigmatismFilter extends Phaser.Filters.Controller {
  magnitude: number;
  axisRadians: number;

  constructor(
    camera: Phaser.Cameras.Scene2D.Camera,
    magnitude: number,
    axisRadians: number,
  ) {
    super(camera, RENDER_NODE_NAME);
    this.magnitude = magnitude;
    this.axisRadians = axisRadians;
  }
}

let renderNodeRegistered = false;

function ensureRenderNodeRegistered(scene: Phaser.Scene): void {
  if (renderNodeRegistered) return;
  const renderer = scene.sys.renderer as
    | (Phaser.Renderer.WebGL.WebGLRenderer & { renderNodes: RenderNodeManagerLike })
    | undefined;
  if (renderer === undefined || renderer.renderNodes === undefined) return;
  const manager = renderer.renderNodes;
  if (manager.hasNode(RENDER_NODE_NAME, true)) {
    renderNodeRegistered = true;
    return;
  }

  const BaseFilterShader = Phaser.Renderer.WebGL.RenderNodes.BaseFilterShader;

  class FilterAstigmatism extends BaseFilterShader {
    constructor(mgr: Phaser.Renderer.WebGL.RenderNodes.RenderNodeManager) {
      super(RENDER_NODE_NAME, mgr, undefined, astigmatismFrag);
    }
    override setupUniforms(controller: Phaser.Filters.Controller): void {
      const c = controller as AstigmatismFilter;
      const cam = c.camera;
      const programManager = (this as unknown as {
        programManager: { setUniform(name: string, value: number | number[]): void };
      }).programManager;
      programManager.setUniform('uMagnitude', c.magnitude);
      programManager.setUniform('uAxisRadians', c.axisRadians);
      programManager.setUniform('uResolution', [
        Math.max(cam.width, 1),
        Math.max(cam.height, 1),
      ]);
      programManager.setUniform('uMaxRadius', MAX_RADIUS_PX);
    }
  }

  manager.addNode(
    RENDER_NODE_NAME,
    new FilterAstigmatism(manager as unknown as Phaser.Renderer.WebGL.RenderNodes.RenderNodeManager),
  );
  renderNodeRegistered = true;
}

interface AstigParams {
  leftActive: boolean;
  leftMagnitude: number;
  leftAxis: number;
  rightActive: boolean;
  rightMagnitude: number;
  rightAxis: number;
}

const filters = new WeakMap<Phaser.Cameras.Scene2D.Camera, AstigmatismFilter>();

function pickAxis(p: AstigParams): number {
  // When both eyes are enabled in 'both' view mode, use the higher-
  // magnitude side's axis (averaging two angles wraps badly around 0/180).
  // With matching magnitudes left wins, arbitrary but stable.
  if (p.leftActive && p.rightActive) {
    return p.leftMagnitude >= p.rightMagnitude ? p.leftAxis : p.rightAxis;
  }
  return p.leftActive ? p.leftAxis : p.rightAxis;
}

export function syncAstigmatism(
  scene: Phaser.Scene,
  camera: Phaser.Cameras.Scene2D.Camera,
  params: AstigParams,
): void {
  const anyActive = params.leftActive || params.rightActive;
  // pipelineManager.pickPair() has already substituted L/R per viewMode;
  // averaging magnitude matters only in 'both' mode.
  const magnitude = (params.leftMagnitude + params.rightMagnitude) / 2;
  let filter = filters.get(camera) ?? null;

  if (anyActive && magnitude > ACTIVE_THRESHOLD) {
    if (filter === null) {
      ensureRenderNodeRegistered(scene);
      filter = new AstigmatismFilter(camera, magnitude, 0);
      camera.filters.internal.add(filter);
      filters.set(camera, filter);
    }
    filter.magnitude = magnitude;
    filter.axisRadians = (pickAxis(params) * Math.PI) / 180;
  } else if (filter !== null) {
    camera.filters.internal.remove(filter);
    filters.delete(camera);
  }
}

export function disposeAstigmatism(camera: Phaser.Cameras.Scene2D.Camera): void {
  const filter = filters.get(camera);
  if (filter !== undefined) {
    camera.filters.internal.remove(filter);
    filters.delete(camera);
  }
}
