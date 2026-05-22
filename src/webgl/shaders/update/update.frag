#version 300 es
#define PI  3.14159265358979
#define TWO_PI 6.28318530717959
precision highp float;
uniform sampler2D u_current;
uniform sampler2D u_start;
uniform sampler2D u_end;
uniform sampler2D u_wave;
uniform float     u_mix;
uniform float     u_mixRate;
uniform float     u_time;
uniform float     u_scale;
uniform float     u_texSize;

out vec4 fragColor;

float hash(float n) { return fract(sin(n) * u_time * 0.0001); }
   
void main() {
  vec2 uv = (floor(gl_FragCoord.xy) + 0.5) / u_texSize;

  vec4 cur    = texture(u_current, uv);
  vec4 start  = texture(u_start,    uv);
  vec4 end    = texture(u_end,    uv);


  // If ellipse
  // get current theta
  //
  // move small theta along ellipse
  // start.xy → ellipse center
  // end.xy   → ellipse radii (rx, ry)
  // cur.xy   → current position on ellipsepse
  // end.w    → flag for ellipse 
  vec4 next;

  next = mix(start, end, u_mix);
  next = mix(cur, next, u_mixRate * end.w);

  // currentPos = center + vec2(rx * cos(theta), ry * sin(theta));
  vec2 worldUV = next.xy * 0.5 + 0.5; // remap from [-1,1] to [0,1]
  vec4 wave = texture(u_wave, worldUV);
      
  next.z = mix(next.z, next.z + (wave.x * 0.5), 0.05);      
  fragColor = next;
}

