#version 300

precision highp float;
uniform float u_texSize;
uniform vec3 u_mousePos;
uniform float u_time;
uniform float u_clickTime;

out vec4 fragColor;
  
void main() {
  vec2 uv = gl_FragCoord.xy / u_texSize;
  float dist = distance(uv, u_mousePos);
  float elapsed = u_time - u_clickTime;
  if (dist < 0.1) {
  }
  float strength = clamp(hover + wave, 0.0, 1.0);
  fragColor = vec4(strength, 0.0, 0.0, 1.0);    
}

