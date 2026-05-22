#version 300 es
uniform sampler2D u_pos;
uniform int       u_texSize;

out float v_alpha;

void main() {
  int size = u_texSize;

  int id = gl_VertexID;

  int col = id % size;
  int row = id / size;      
  
  vec2 uv = (vec2(float(col), float(row)) + 0.5) / float(size);
  vec4 pos = texture(u_pos, uv);

  gl_PointSize = 1.5; // never below 1px
  gl_Position  = vec4(pos.xy, 0.0, 1.0); 

  v_alpha = pos.w;
}
