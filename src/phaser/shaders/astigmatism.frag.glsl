#pragma phaserTemplate(shaderName)
precision mediump float;

uniform sampler2D uMainSampler;
uniform float uMagnitude;    // 0..1
uniform float uAxisRadians;  // 0..PI (axis = direction of sharp focus)
uniform vec2 uResolution;    // canvas size in pixels
uniform float uMaxRadius;    // max half-kernel length in pixels at magnitude=1

varying vec2 outTexCoord;

// 17-tap separable directional Gaussian along the cylinder axis. Sampling
// along the axis blurs lines perpendicular to it (the cylindrical-lens
// defocus model: rays parallel to the axis focus correctly; rays
// perpendicular spread out into a line). Matches clinical convention:
// WTR (axis ≈ 90°) smears the retinal image vertically.

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
    float w = exp(-(x * x) / (2.0 * sigma * sigma));
    color += texture2D(uMainSampler, outTexCoord + texel * x * (radius / 8.0)) * w;
    total += w;
  }
  gl_FragColor = color / total;
}
