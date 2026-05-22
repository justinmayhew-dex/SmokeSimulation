#version 300 es
precision highp float;

uniform sampler2D u_velocity; // The "Map" (Wind)
uniform sampler2D u_position;  // The "Payload" (Smoke/Ink)
uniform float u_dt;
uniform float u_rdx;

in vec2 v_uv;

out vec4 fragColor;

void main() {
    vec4 currentState = texture(u_position, v_uv); 
    vec2 currentPos = currentState.xy;

    vec2 fluidUV = currentPos * 0.5 + 0.5;
    vec2 wind = texture(u_velocity, fluidUV).xy;

    vec2 nextPos = currentPos + (wind * u_dt);

    fragColor = vec4(nextPos, currentState.z, currentState.w);
}
