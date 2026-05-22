#version 300 es
precision highp float;

uniform sampler2D u_velocity; // The "Map" (Velocity Field)
uniform sampler2D u_quantity; // The "Payload" (Velocity OR Density)
uniform float u_dt;
uniform float u_rdx;

out vec4 fragColor;

void main() {
    vec2 size = vec2(textureSize(u_velocity, 0));
    
    // 1. Use the actual floating point center (e.g., 0.5, 1.5, etc.)
    vec2 currentPos = gl_FragCoord.xy; 

    // 2. Fetch velocity (texelFetch needs ivec2, so we cast just for the fetch)
    vec2 vel = texelFetch(u_velocity, ivec2(currentPos), 0).xy;

    // 3. Backtrack (Stay in "pixel space" for now)
    // Note: ensure your units for vel/dt/rdx match your pixel scale!
    // Force u_rdx to be 1.0 and remove the 5.0 multiplier
    vec2 backPos = currentPos - (u_dt * vel * u_rdx);

    // 4. Convert to 0.0-1.0 UV for the bilinear texture() call
    // This ensures that if vel=0, backPos/size == gl_FragCoord/size (the true center)
    vec2 uv = backPos / size;

    fragColor = texture(u_quantity, uv);
}
