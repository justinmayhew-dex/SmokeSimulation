#version 300 es
precision highp float;

uniform sampler2D u_velocity;
uniform sampler2D u_curl;
uniform float u_curl_strength; // Try 0.1 to 0.5
uniform float u_dt;
uniform float u_halfrdx;

out vec4 fragColor;

void main() {
    ivec2 T = ivec2(gl_FragCoord.xy);

    // 1. Get curl of neighbors (absolute values)
    float cL = abs(texelFetch(u_curl, T - ivec2(1, 0), 0).r);
    float cR = abs(texelFetch(u_curl, T + ivec2(1, 0), 0).r);
    float cB = abs(texelFetch(u_curl, T - ivec2(0, 1), 0).r);
    float cT = abs(texelFetch(u_curl, T + ivec2(0, 1), 0).r);
    float cC = abs(texelFetch(u_curl, T, 0).r);

    // 2. Calculate the gradient of the curl magnitude
    vec2 force = u_halfrdx * vec2(cR - cL, cT - cB);

    // 3. Normalize the force to get the direction
    float epsilon = 1e-5; // Prevent division by zero
    float mag = length(force) + epsilon;
    force /= mag;

    // 4. Calculate final "kick" force (cross product logic)
    // This pushes the velocity perpendicular to the curl gradient
    float curlC = texelFetch(u_curl, T, 0).r;
    vec2 vorticityForce = vec2(force.y, -force.x) * curlC * u_curl_strength;

    // 5. Apply to current velocity
    vec2 vel = texelFetch(u_velocity, T, 0).xy;
    fragColor = vec4(vel + u_dt * vorticityForce, 0.0, 1.0);
}
