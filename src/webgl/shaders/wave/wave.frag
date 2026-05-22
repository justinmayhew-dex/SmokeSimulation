// waveFS
#version 300 es
precision highp float;
uniform float u_texSize;
uniform vec2 u_mousePos;
uniform float u_time;
uniform float u_clickTime;

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / 200.0;
  vec2 center = (u_mousePos + 1.0) / 2.0;

  float dist = distance(uv, center);
  float elapsed = u_time - u_clickTime;

  // Hover blob
  float hoverRadius = 0.05;
  float hover = (1.0 - smoothstep(0.0, hoverRadius, dist)) * 0.05;

  // Expanding ring
  float radius = elapsed * 0.2;
  float ringWidth = 0.05;
  float ring = 1.0 - smoothstep(0.0, ringWidth, abs(dist - radius));
  float fade = 1.0 - smoothstep(0.0, 1.5, elapsed);
  float wave = ring * fade * 0.1;

  float strength = clamp(hover + wave, 0.0, 1.0);
  fragColor = vec4(strength, 0.0, 0.0, 1.0);    
}
