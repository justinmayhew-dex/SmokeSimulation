#version 300 es
precision highp float;

// ── VELOCITY COLOR: receive speed from vertex shader ────
in float v_alpha;
in float v_size;
// ────────────────────────────────────────────────────────

out vec4 fragColor;

void main() {
  //float d = length(gl_PointCoord - 0.5) * 2.0;
  //float a = 1.0 - smoothstep(0.6, 1.0, d);

  // Fade opacity as points get tiny instead of aliasing
  float sizeFade = clamp(v_size, 0.0, 1.0);

  //float t = clamp(v_speed, 0.0, 1.0);
  // ── VELOCITY COLOR ───────────────────────────────────
  // slow = deep blue, mid = cyan, fast = white-hot
  //vec3 slow = vec3(0.1,  0.4,  0.9);   // deep blue   (settled)
  //vec3 mid  = vec3(0.3,  0.85, 1.0);   // cyan        (moving)
  //vec3 hot  = vec3(1.0,  0.95, 0.85);  // warm white  (fast)
  //vec3 col  = t < 0.5
  //  ? mix(slow, mid, t * 2.0)
  //  : mix(mid,  hot, (t - 0.5) * 2.0);

  fragColor = vec4(0.02, 0.87, 0.45, 1.0) * v_alpha;      
  // ────────────────────────────────────────────────────
}

