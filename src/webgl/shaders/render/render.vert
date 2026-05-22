#version 300 es
uniform mat4      u_viewProj;
uniform sampler2D u_posTex;
uniform int       u_texSize;
uniform float     u_pointSize;
uniform float     u_time;

// ── VELOCITY COLOR: pass speed to fragment shader ────────
out float v_alpha;
out float v_size;  
// ────────────────────────────────────────────────────────

void main() {
  int size = u_texSize;

  int id = gl_VertexID;

  int col = id % size;
  int row = id / size;      
  
  vec2 uv = (vec2(float(col), float(row)) + 0.5) / float(size);
  vec4 pos = texture(u_posTex, uv);
  
  vec4 projected =  u_viewProj * vec4(pos.xyz, 1.0);
  float pSize = u_pointSize * (1.0 / projected.w) * 10.0;

  // Pass clamped size and a fade to fragment
  v_size = pSize;
  gl_PointSize = 1.5; // never below 1px
  
  gl_Position  = projected; 

  // ── VELOCITY COLOR: read speed from w channel ────────
  v_alpha = pos.w;
  // ────────────────────────────────────────────────────
}
