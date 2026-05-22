#version 300 es
precision highp float;

in float v_alpha;

out vec4 fragColor;

void main() {
  fragColor = vec4(0.02, 0.87, 0.45, 1.0) * v_alpha;      
}
