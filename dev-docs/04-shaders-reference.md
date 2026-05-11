# 04 — Shaders Reference

GLSL implementations and color-matrix data for each pipeline. These are starting points — verify against the references before shipping. All shaders target WebGL 1.0 GLSL (`#version 100`) for broad compatibility unless noted otherwise.

> **Pattern.** Phaser's `PostFXPipeline` provides `uMainSampler` (the input texture) and `outTexCoord` (the UV). Custom uniforms are declared and updated from the pipeline class.

## Common preamble

```glsl
precision mediump float;
uniform sampler2D uMainSampler;
varying vec2 outTexCoord;

vec3 srgbToLinear(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
}
vec3 linearToSrgb(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0/2.4)) - 0.055, step(0.0031308, c));
}
```

Use the sRGB conversions only where needed (color-vision matrices benefit; pure spatial filters like blur don't).

---

## Blur (myopia / hyperopia / presbyopia)

Separable Gaussian, 2 passes. Each pass samples along one axis. `uStrength` ∈ [0, 1] maps to a kernel radius in pixels via `uMaxRadius * uStrength` (e.g. 24 px).

```glsl
// blur.frag.glsl
uniform vec2 uDirection;   // (1, 0) or (0, 1)
uniform float uStrength;   // 0..1
uniform vec2 uResolution;  // canvas px
uniform float uMaxRadius;  // e.g. 24.0

void main() {
  float radius = uMaxRadius * uStrength;
  if (radius < 0.5) {
    gl_FragColor = texture2D(uMainSampler, outTexCoord);
    return;
  }
  vec2 texel = uDirection / uResolution;
  // 9-tap Gaussian, weights for sigma = radius/3
  float sigma = max(radius / 3.0, 0.5);
  float weights[9];
  float sum = 0.0;
  for (int i = 0; i < 9; i++) {
    float x = float(i - 4);
    weights[i] = exp(-(x*x) / (2.0 * sigma * sigma));
    sum += weights[i];
  }
  vec4 color = vec4(0.0);
  for (int i = 0; i < 9; i++) {
    float offset = float(i - 4) * (radius / 4.0);
    color += texture2D(uMainSampler, outTexCoord + texel * offset) * weights[i];
  }
  gl_FragColor = color / sum;
}
```

The pipeline runs this twice (horizontal then vertical). Phaser's `PostFXPipeline.bindAndDraw` between two render targets handles the two-pass dance.

---

## Astigmatism — directional blur

Single pass, kernel weights elongated along the axis vector.

```glsl
// astigmatism.frag.glsl
uniform float uMagnitude;    // 0..1
uniform float uAxisRadians;  // 0..PI
uniform vec2 uResolution;
uniform float uMaxRadius;    // e.g. 24.0

void main() {
  if (uMagnitude < 0.01) {
    gl_FragColor = texture2D(uMainSampler, outTexCoord);
    return;
  }
  float radius = uMaxRadius * uMagnitude;
  vec2 dir = vec2(cos(uAxisRadians), sin(uAxisRadians));
  vec2 texel = dir / uResolution;
  float sigma = max(radius / 3.0, 0.5);
  vec4 color = vec4(0.0);
  float total = 0.0;
  for (int i = -8; i <= 8; i++) {
    float x = float(i);
    float w = exp(-(x*x) / (2.0 * sigma * sigma));
    color += texture2D(uMainSampler, outTexCoord + texel * x * (radius / 8.0)) * w;
    total += w;
  }
  gl_FragColor = color / total;
}
```

---

## Color vision deficiency

Apply a 3×3 matrix in linear RGB, with a severity mix between identity and the deficiency matrix.

```glsl
// colorVision.frag.glsl
uniform mat3 uMatrix;
uniform float uSeverity; // 0..1

void main() {
  vec4 c = texture2D(uMainSampler, outTexCoord);
  vec3 lin = srgbToLinear(c.rgb);
  vec3 def = uMatrix * lin;
  vec3 mixed = mix(lin, def, uSeverity);
  gl_FragColor = vec4(linearToSrgb(mixed), c.a);
}
```

### Matrices (sRGB linear space, column-major in GLSL = row-major data here)

These are the widely-used Machado-derived matrices for full-strength dichromacy. Set them in JS and pass to the shader. Source: <https://gist.github.com/Lokno/df7c3bfdc9ad32558bb7>, validated against Brettel/Viénot/Mollon (1997).

```ts
// src/constants/colorMatrices.ts
export const COLOR_MATRICES = {
  normal: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  protanopia: [0.567, 0.433, 0.0, 0.558, 0.442, 0.0, 0.0, 0.242, 0.758],
  deuteranopia: [0.625, 0.375, 0.0, 0.7, 0.3, 0.0, 0.0, 0.3, 0.7],
  tritanopia: [0.95, 0.05, 0.0, 0.0, 0.433, 0.567, 0.0, 0.475, 0.525],
  protanomaly: [0.817, 0.183, 0.0, 0.333, 0.667, 0.0, 0.0, 0.125, 0.875],
  deuteranomaly: [0.8, 0.2, 0.0, 0.258, 0.742, 0.0, 0.0, 0.142, 0.858],
  tritanomaly: [0.967, 0.033, 0.0, 0.0, 0.733, 0.267, 0.0, 0.183, 0.817],
  achromatopsia: [0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114],
} as const;
```

For the "anomaly" types, you can either ship the dedicated matrix above **or** use the dichromacy matrix with `severity ≈ 0.6` — both look credible. Default to the dedicated matrix; expose severity as a fine-tune slider.

> **More accurate matrices** (Brettel-Viénot in LMS space): see <https://ixora.io/projects/colorblindness/color-blindness-simulation-research/>. Implement these in v1.1 if visual accuracy reports come in low.

---

## Cataract

Combines four sub-effects in one shader: cloud overlay, brightness reduction, yellowing (channel scaling + blue desat), and glare bloom for highlights.

```glsl
// cataract.frag.glsl
uniform float uCloudiness;     // 0..1
uniform float uYellowing;      // 0..1
uniform float uBrightnessLoss; // 0..1
uniform float uGlare;          // 0..1
uniform sampler2D uNoise;      // tiled low-freq noise texture for cloud variation

void main() {
  vec4 c = texture2D(uMainSampler, outTexCoord);

  // Yellowing: scale blue down, slight green tint
  vec3 yellowed = mix(c.rgb, c.rgb * vec3(1.0, 0.95, 0.6), uYellowing);

  // Brightness loss: multiplicative dim
  vec3 dimmed = yellowed * (1.0 - uBrightnessLoss * 0.7);

  // Cloud haze: blend toward a desaturated grey, modulated by noise
  float n = texture2D(uNoise, outTexCoord * 2.0).r;
  vec3 haze = mix(dimmed, vec3(0.78, 0.78, 0.74), uCloudiness * (0.6 + 0.4 * n));

  // Glare: lift brightness where original is bright (cheap bloom proxy)
  float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  float glareMask = smoothstep(0.7, 1.0, lum);
  vec3 withGlare = haze + glareMask * uGlare * vec3(1.0, 1.0, 0.9);

  gl_FragColor = vec4(withGlare, c.a);
}
```

A separate small Gaussian blur applied **before** this pipeline accounts for the perceptual blur of cataracts. Don't duplicate blur logic inside the cataract shader.

The subtype selector (nuclear/cortical/subcapsular) in the UI sets the four parameters to preset combinations:

| Subtype     | yellowing | cloudiness | brightnessLoss | glare |
| ----------- | --------- | ---------- | -------------- | ----- |
| nuclear     | 0.7       | 0.3        | 0.4            | 0.1   |
| cortical    | 0.2       | 0.6        | 0.3            | 0.5   |
| subcapsular | 0.1       | 0.3        | 0.2            | 0.9   |

These are starting points; the user can drag any slider after.

---

## Glaucoma — peripheral vignette

```glsl
// glaucoma.frag.glsl
uniform float uInnerRadius; // 0..0.7 (normalized)
uniform float uFeather;     // 0..0.3
uniform float uSeverity;    // 0..1
uniform vec2 uAspect;       // (1, aspect) so circle is round

void main() {
  vec4 c = texture2D(uMainSampler, outTexCoord);
  vec2 p = (outTexCoord - 0.5) * uAspect * 2.0;
  float r = length(p);
  float visible = 1.0 - smoothstep(uInnerRadius, uInnerRadius + uFeather, r);
  // Mix toward black by severity outside the visible region
  vec3 darkened = c.rgb * mix(1.0 - uSeverity, 1.0, visible);
  gl_FragColor = vec4(darkened, c.a);
}
```

Identical logic powers retinitis pigmentosa, with tighter default `innerRadius` and a brightness-loss multiplier applied inside the visible region too.

---

## AMD — central scotoma + metamorphopsia

The scotoma is the inverse of glaucoma: dark in the middle, clear at the edges. Distortion adds UV displacement using a low-frequency noise lookup.

```glsl
// scotoma.frag.glsl
uniform float uScotomaRadius;  // 0..0.5
uniform float uFalloff;        // 0..0.3
uniform float uDistortion;     // 0..1
uniform float uTime;           // seconds, optional for static wobble
uniform sampler2D uNoise;
uniform vec2 uAspect;

void main() {
  vec2 uv = outTexCoord;
  vec2 p = (uv - 0.5) * uAspect * 2.0;
  float r = length(p);

  // Distortion: noise-driven UV warp, strongest near center
  if (uDistortion > 0.0) {
    float dInfluence = (1.0 - smoothstep(uScotomaRadius + 0.2, 0.0, r));
    vec2 n = texture2D(uNoise, uv * 3.0).rg - 0.5;
    uv += n * 0.05 * uDistortion * dInfluence;
  }
  vec4 c = texture2D(uMainSampler, uv);

  // Central dark spot
  float dark = 1.0 - smoothstep(uScotomaRadius, uScotomaRadius + uFalloff, r);
  vec3 result = c.rgb * (1.0 - dark);
  gl_FragColor = vec4(result, c.a);
}
```

---

## Diabetic retinopathy — scattered spots

Pass spot centers and radii as a uniform array (or pack into a small 1D texture if >32 spots needed).

```glsl
// diabeticRetinopathy.frag.glsl
#define MAX_SPOTS 32
uniform int uSpotCount;
uniform vec3 uSpots[MAX_SPOTS]; // (x, y, r) in normalized coords
uniform float uSeverity;

void main() {
  vec4 c = texture2D(uMainSampler, outTexCoord);
  float darkSum = 0.0;
  for (int i = 0; i < MAX_SPOTS; i++) {
    if (i >= uSpotCount) break;
    vec3 s = uSpots[i];
    float d = distance(outTexCoord, s.xy);
    darkSum += 1.0 - smoothstep(s.z * 0.6, s.z, d);
  }
  float mask = clamp(darkSum, 0.0, 1.0) * uSeverity;
  gl_FragColor = vec4(c.rgb * (1.0 - mask), c.a);
}
```

The CPU side regenerates `uSpots` whenever `spotCount` or `spotSize` changes, using a seeded RNG so spots don't jump randomly on every parameter tweak.

---

## Custom mask

Texture-driven local effect. v1 ships with `darken`; later versions can branch on `uEffect` (int) to apply blur or desaturation inside the mask.

```glsl
// customMask.frag.glsl
uniform sampler2D uMask;
uniform float uIntensity;
uniform int uEffect; // 0 = darken, 1 = blur (v1.1), 2 = desat (v1.1)

void main() {
  vec4 c = texture2D(uMainSampler, outTexCoord);
  float m = texture2D(uMask, outTexCoord).a * uIntensity;
  vec3 result;
  if (uEffect == 0) {
    result = c.rgb * (1.0 - m);
  } else if (uEffect == 2) {
    float gray = dot(c.rgb, vec3(0.299, 0.587, 0.114));
    result = mix(c.rgb, vec3(gray), m);
  } else {
    result = c.rgb; // blur handled in a separate pipeline that reads this mask
  }
  gl_FragColor = vec4(result, c.a);
}
```

---

## Floaters

Don't use a shader for floaters — use Phaser sprites. Render a few small dark blob sprites with `alpha < 0.4` on top of the scene, drifting slowly. This is cheaper and easier to animate organically. The "shader" is just Phaser's normal sprite renderer.

```ts
// pseudocode
this.scene.add
  .image(x, y, 'floaterTexture')
  .setAlpha(opacity)
  .setBlendMode(Phaser.BlendModes.MULTIPLY);
```

Use 3–5 different floater textures for variety. Generate them on the fly or include as PNGs in `public/`.

---

## Migraine aura

Static (v1) zigzag pattern around a circular region. For v1, ship a single hand-authored PNG used as a sprite overlay with additive blending. Don't write a procedural shader for this in v1.

---

## Two-pass and multi-pass pipelines in Phaser

For blur (and anything else needing two passes), the pipeline's `onDraw` method takes the source render target and renders intermediate results to the half-size utility targets Phaser exposes. Sketch:

```ts
class BlurPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({ game, renderTarget: true, fragShader });
  }
  onDraw(renderTarget: Phaser.Renderer.WebGL.RenderTarget) {
    this.set2f('uDirection', 1, 0);
    this.drawFrame(renderTarget, this.fullFrame1);
    this.set2f('uDirection', 0, 1);
    this.bindAndDraw(this.fullFrame1);
  }
}
```

Reference: <https://docs.phaser.io/api-documentation/class/renderer-webgl-pipelines-postfxpipeline>.

---

## Validating shaders

For each shader, the implementation step should:

1. Wire it into the pipeline manager.
2. Bind it to the sample image with the default parameters (effect should be invisible).
3. Move the strength slider through 0 → 1 and visually confirm the change is monotonic and smooth.
4. Compare against a reference image from the sources in `03-eye-conditions.md`.

Don't ship a shader that hasn't passed step 4.
