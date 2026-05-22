#version 300 es
    
precision highp float;
uniform sampler2D u_current;
uniform float     u_texSize;
out vec4 fragColor;

const float PI = 3.14159265358979323846;
    
void main() {
  vec2 uv = (floor(gl_FragCoord.xy) + 0.5) / u_texSize;
  float r = 0.0;
  float phi = 0.0;

  float a = uv.x * 2.0 - 1.0;
  float b = uv.y * 2.0 - 1.0;
  if (a > -b) {
    if (a > b) {
      r = a;
      phi = (PI / 4.0) * (b / a);
    }
    else {
      r = b;
      phi = (PI / 4.0) * (2.0 - (a / b));
    }
  }
  else {
    if (a < b) {
      r = -a;
      phi = (PI / 4.0) * (4.0 + (b / a));
    }
    else {
      r = -b;
      if (b != 0.0) {
        phi = (PI / 4.0) * (6.0 - (a / b));
      }
      else {
        phi = 0.0;
      }
    }
  }
  float u = r * cos(phi);
  float v = r * sin(phi);
  float r2 = length(vec2(u, v));
  r = clamp(abs(r), 0.0, 1.0); // clamp before acos
  float theta = acos(clamp(1.0 - 2.0 * r, -1.0, 1.0));    
  float sinT = sin(theta);
  float cosT = cos(theta);

  vec2 dir = r2 > 0.00001 ? vec2(u, v) / r2 : vec2(0.0);

  float sx = sinT * dir.x;
  float sz = sinT * dir.y;
  float sy = -cosT;
  
  fragColor = vec4(vec3(sx, sy, sz) * 0.5, 1.0);
}
