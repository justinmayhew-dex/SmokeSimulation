#version 300 es
precision highp float;

uniform sampler2D u_target;   // The current field (Velocity or Density)
uniform vec2 u_point;         // Center of the splat (in pixel coordinates)
uniform vec3 u_color;         // Value to add (vec3(x, y, 0) for force, vec3(r, g, b) for smoke)
uniform float u_radius;       // Size of the splat
uniform float u_aspect;       // Aspect ratio to keep the splat circular

out vec4 fragColor;

void main() {
    vec2 size = vec2(textureSize(u_target, 0));
    vec2 uv = gl_FragCoord.xy / size;

    // Calculate distance from current pixel to splat center
    // Adjusting for aspect ratio ensures the splat isn't an oval
    vec2 diff = (gl_FragCoord.xy - u_point);
    diff.x *= u_aspect; 
    
    float dist = dot(diff, diff);
    
    // Gaussian-ish falloff for a smooth "puff"
    float strength = exp(-dist / u_radius);

    // Sample the existing state
    vec4 base = texture(u_target, uv);

    // ADD the new value to the existing value
    fragColor = vec4(base.rgb + u_color * strength, 1.0);
}
