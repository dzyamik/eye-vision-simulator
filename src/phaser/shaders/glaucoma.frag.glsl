#pragma phaserTemplate(shaderName)
precision mediump float;

uniform sampler2D uMainSampler;
uniform float uInnerRadius;
uniform float uFeather;
uniform float uSeverity;
uniform vec2 uAspect;

varying vec2 outTexCoord;

void main() {
  vec4 c = texture2D(uMainSampler, outTexCoord);
  vec2 p = (outTexCoord - 0.5) * uAspect * 2.0;
  float r = length(p);
  float visible = 1.0 - smoothstep(uInnerRadius, uInnerRadius + uFeather, r);
  vec3 darkened = c.rgb * mix(1.0 - uSeverity, 1.0, visible);
  gl_FragColor = vec4(darkened, c.a);
}
