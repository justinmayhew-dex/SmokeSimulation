#version 300 es
precision highp float;

uniform sampler2D u_velocity;
uniform float u_halfrdx; // 0.5 / grid_spacing

out vec4 fragColor;

void main() {
    ivec2 T = ivec2(gl_FragCoord.xy);

    // Sample velocity neighbors
    float vL = texelFetch(u_velocity, T - ivec2(1, 0), 0).y;
    float vR = texelFetch(u_velocity, T + ivec2(1, 0), 0).y;
    float vB = texelFetch(u_velocity, T - ivec2(0, 1), 0).x;
    float vT = texelFetch(u_velocity, T + ivec2(0, 1), 0).x;

    // Curl formula: dV/dx - dU/dy
    float curl = u_halfrdx * (vR - vL - (vT - vB));
    
    // Output to a single-channel texture (R)
    fragColor = vec4(curl, 0.0, 0.0, 1.0);
}
