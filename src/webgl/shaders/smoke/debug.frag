#version 300 es
precision highp float;
uniform sampler2D u_tex;
uniform int u_mode; // 0: Density, 1: Velocity, 2: Pressure
out vec4 fragColor;
in vec2 v_uv;
void main() {
  vec4 data = texture(u_tex, v_uv);
  if (u_mode == 0) {
        fragColor = vec4(data.rgb, 1.0); // Smoke
    } else if (u_mode == 1) {
        // Map -1..1 velocity to 0..1 color (Visualizes direction)
        fragColor = vec4(data.rg * 0.5 + 0.5, 0.5, 1.0); 
    } else {
        // Pressure is usually small, scale it up to see it
        fragColor = vec4(vec3(data.x * 10.0), 1.0); 
    }
    fragColor = vec4(data.rgb, 1.0);
}
