#version 300 es
precision highp float;
  
uniform sampler2D u_velocity;
uniform float u_halfrdx;
  
out vec4 fragColor;
  
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  vec2 vL = texelFetch(u_velocity, c + ivec2(-1,  0), 0).xy;
  vec2 vR = texelFetch(u_velocity, c + ivec2( 1,  0), 0).xy;
  vec2 vB = texelFetch(u_velocity, c + ivec2( 0, -1), 0).xy;
  vec2 vT = texelFetch(u_velocity, c + ivec2( 0,  1), 0).xy;
  float div = u_halfrdx * ((vR.x - vL.x) + (vT.y - vB.y));
  div = clamp(div, -100.0, 100.0);
  fragColor = vec4(div, 0.0, 0.0, 1.0);
}

