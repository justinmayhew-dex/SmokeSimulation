#version 300 es
precision highp float;

uniform sampler2D u_velocity; // The "Map" (Wind)
uniform sampler2D u_density;  // The "Payload" (Smoke/Ink)
uniform float u_dt;
uniform float u_rdx;

out vec4 fragColor;

void main() {
    vec2 size = vec2(textureSize(u_velocity, 0));
    vec2 pos = gl_FragCoord.xy;

    // 1. Get the wind speed at this location
    vec2 vel = texture(u_velocity, pos / size).xy;

    // 2. Backtrack: Where was the smoke 1 frame ago?
    vec2 backPos = pos - (u_dt * vel * u_rdx);

    backPos = clamp(backPos, 0.0001, 999.999);
    // 3. Sample the density from that previous location
    fragColor = texture(u_density, backPos / size) * 0.998;
}
