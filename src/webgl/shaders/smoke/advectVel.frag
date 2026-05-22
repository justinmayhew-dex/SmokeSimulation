#version 300 es
precision highp float;

uniform sampler2D u_velocity; // The "Map" and the "Payload"
uniform float u_dt;
uniform float u_rdx; // Set to 1.0 if using pixel-space velocity

in vec2 v_uv;

out vec4 fragColor;

void main() {
    vec2 size = vec2(textureSize(u_velocity, 0));
    vec2 pos = gl_FragCoord.xy;

    // 1. Sample current velocity at this pixel
    vec2 vel = texture(u_velocity, pos / size).xy;

    // 2. Backtrack: Where was this velocity 1 frame ago?
    vec2 backPos = pos - (u_dt * vel * u_rdx);

    float margin = 1.0 / 512.0; 
    float edgeFactor = smoothstep(0.0, margin, v_uv.x) * smoothstep(1.0, 1.0 - margin, v_uv.x) * smoothstep(0.0, margin, v_uv.y) * smoothstep(1.0, 1.0 - margin, v_uv.y);

    // 3. Sample the velocity from that previous location
    // Using texture() provides the necessary bilinear interpolation
    fragColor = texture(u_velocity, backPos / size) * 0.998 * edgeFactor;
}
