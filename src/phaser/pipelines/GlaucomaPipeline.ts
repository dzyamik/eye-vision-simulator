// Glaucoma — peripheral-vision-loss vignette with a tunable feather. The
// spec calls for innerRadius (size of preserved central area), feather
// (gradient softness) and severity (how dark the periphery gets). Phaser's
// built-in Vignette filter has a fixed falloff and can't express feather,
// so this pipeline registers a custom GLSL Filter (see ./glaucoma.frag.glsl)
// the first time it's used. The render node is process-singleton; the
// per-camera Controller is recreated per camera as usual.
//
// Aspect compensation is applied in `setupUniforms` so the visible disc
// stays circular regardless of canvas dimensions.

import Phaser from 'phaser';

import glaucomaFrag from '@/phaser/shaders/glaucoma.frag.glsl?raw';

const ACTIVE_THRESHOLD = 0.005;
const RENDER_NODE_NAME = 'FilterGlaucoma';

// Avoid `any` for the RenderNodeManager argument: the Phaser type isn't
// re-exported in a convenient place, so we use the shape we actually call.
interface RenderNodeManagerLike {
  hasNode(name: string, constructed?: boolean): boolean;
  addNode(name: string, node: object): void;
}

class GlaucomaFilter extends Phaser.Filters.Controller {
  innerRadius: number;
  feather: number;
  severity: number;

  constructor(
    camera: Phaser.Cameras.Scene2D.Camera,
    innerRadius: number,
    feather: number,
    severity: number,
  ) {
    super(camera, RENDER_NODE_NAME);
    this.innerRadius = innerRadius;
    this.feather = feather;
    this.severity = severity;
  }
}

let renderNodeRegistered = false;

function ensureRenderNodeRegistered(scene: Phaser.Scene): void {
  if (renderNodeRegistered) return;
  // `renderer` may be the headless renderer in tests; guard the cast.
  const renderer = scene.sys.renderer as
    | (Phaser.Renderer.WebGL.WebGLRenderer & { renderNodes: RenderNodeManagerLike })
    | undefined;
  if (renderer === undefined || renderer.renderNodes === undefined) return;
  const manager = renderer.renderNodes;
  if (manager.hasNode(RENDER_NODE_NAME, true)) {
    renderNodeRegistered = true;
    return;
  }

  // BaseFilterShader is published as a class on the Phaser namespace.
  // Subclass it and override setupUniforms to push our four uniforms.
  const BaseFilterShader = Phaser.Renderer.WebGL.RenderNodes.BaseFilterShader;

  class FilterGlaucoma extends BaseFilterShader {
    constructor(mgr: Phaser.Renderer.WebGL.RenderNodes.RenderNodeManager) {
      super(RENDER_NODE_NAME, mgr, undefined, glaucomaFrag);
    }
    override setupUniforms(controller: Phaser.Filters.Controller): void {
      const c = controller as GlaucomaFilter;
      const cam = c.camera;
      const aspect = cam.height > 0 ? cam.width / cam.height : 1;
      // programManager is exposed on BaseFilterShader; access via `this`.
      const programManager = (this as unknown as {
        programManager: { setUniform(name: string, value: number | number[]): void };
      }).programManager;
      programManager.setUniform('uInnerRadius', c.innerRadius);
      programManager.setUniform('uFeather', c.feather);
      programManager.setUniform('uSeverity', c.severity);
      programManager.setUniform('uAspect', [1, aspect]);
    }
  }

  manager.addNode(
    RENDER_NODE_NAME,
    new FilterGlaucoma(manager as unknown as Phaser.Renderer.WebGL.RenderNodes.RenderNodeManager),
  );
  renderNodeRegistered = true;
}

interface GlaucomaParams {
  leftActive: boolean;
  leftInnerRadius: number;
  leftFeather: number;
  leftSeverity: number;
  rightActive: boolean;
  rightInnerRadius: number;
  rightFeather: number;
  rightSeverity: number;
}

const filters = new WeakMap<Phaser.Cameras.Scene2D.Camera, GlaucomaFilter>();

export function syncGlaucoma(
  scene: Phaser.Scene,
  camera: Phaser.Cameras.Scene2D.Camera,
  params: GlaucomaParams,
): void {
  const anyActive = params.leftActive || params.rightActive;
  // pipelineManager.pickPair() has already substituted L/R per viewMode;
  // averaging matters only in 'both' mode.
  const innerRadius = (params.leftInnerRadius + params.rightInnerRadius) / 2;
  const feather = (params.leftFeather + params.rightFeather) / 2;
  const severity = (params.leftSeverity + params.rightSeverity) / 2;
  const effective = anyActive && severity > ACTIVE_THRESHOLD;
  let filter = filters.get(camera) ?? null;

  if (effective) {
    if (filter === null) {
      ensureRenderNodeRegistered(scene);
      filter = new GlaucomaFilter(camera, innerRadius, feather, severity);
      camera.filters.internal.add(filter);
      filters.set(camera, filter);
    }
    filter.innerRadius = innerRadius;
    filter.feather = feather;
    filter.severity = severity;
  } else if (filter !== null) {
    camera.filters.internal.remove(filter);
    filters.delete(camera);
  }
}

export function disposeGlaucoma(camera: Phaser.Cameras.Scene2D.Camera): void {
  const filter = filters.get(camera);
  if (filter !== undefined) {
    camera.filters.internal.remove(filter);
    filters.delete(camera);
  }
}
