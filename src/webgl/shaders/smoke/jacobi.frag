#version 300 es
precision highp float;

uniform sampler2D u_pressure;
uniform sampler2D u_divergence;
uniform float u_alpha;
uniform float u_rBeta;

out vec4 fragColor;

void main() {
    ivec2 c = ivec2(gl_FragCoord.xy);
    float pL = texelFetch(u_pressure, c + ivec2(-1,  0), 0).x;
    float pR = texelFetch(u_pressure, c + ivec2( 1,  0), 0).x;
    float pB = texelFetch(u_pressure, c + ivec2( 0, -1), 0).x;
    float pT = texelFetch(u_pressure, c + ivec2( 0,  1), 0).x;
    float bC = texelFetch(u_divergence, c, 0).x;
    float p = (pL + pR + pB + pT + u_alpha * bC) * u_rBeta;
    p = clamp(p, -100.0, 100.0);
    fragColor = vec4(p, 0.0, 0.0, 1.0);
}

