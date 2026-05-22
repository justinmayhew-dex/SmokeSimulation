#version 300 es

in vec3 a_pos;

uniform mat4 u_viewProj;

void main() {
  vec4 projected = u_viewProj * vec4(a_pos, 1.0);
  gl_Position = vec4(projected);
}

