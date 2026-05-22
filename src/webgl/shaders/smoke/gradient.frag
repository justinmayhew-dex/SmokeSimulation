#version 300 es
precision highp float;

uniform sampler2D u_velocity; // The advected (dirty) velocity
uniform sampler2D u_pressure; // The solved pressure from Jacobi
uniform float u_halfrdx;      // 0.5 / grid_spacing (usually 0.5 * TEX_SIZE)

out vec4 fragColor;

void main() {
    ivec2 T = ivec2(gl_FragCoord.xy);

    // 1. Sample pressure neighbors
    // Note: Use texelFetch for exact pixel alignment
    float pL = texelFetch(u_pressure, T - ivec2(1, 0), 0).r;
    float pR = texelFetch(u_pressure, T + ivec2(1, 0), 0).r;
    float pB = texelFetch(u_pressure, T - ivec2(0, 1), 0).r;
    float pT = texelFetch(u_pressure, T + ivec2(0, 1), 0).r;

    // 2. Boundary Handling: If we are at the edge, the pressure gradient 
    // should effectively be zero to prevent "leaking" out of the box.
    // (Simplest version: if neighbor is out of bounds, use center pressure)
    // ivec2 size = textureSize(u_pressure, 0);
    // if(T.x <= 0) pL = texelFetch(u_pressure, T, 0).r;
    // ... etc ...

    // 3. Calculate the Pressure Gradient
    vec2 gradP = vec2(pR - pL, pT - pB) * u_halfrdx * 1.0;

    // 4. Subtract it from the velocity
    vec2 vOld = texelFetch(u_velocity, T, 0).xy;
    vec2 vNew = vOld - gradP;

    fragColor = vec4(vNew, 0.0, 1.0);
}
