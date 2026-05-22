#version 300 es

in vec3 aPosition;

uniform mat4 u_viewProj;
uniform vec4 uColor;

out vec4 color;

void main() {
  gl_Position = vec4(aPosition, 1.0);
  gl_PointSize = 10.0;
  color = uColor;
}


