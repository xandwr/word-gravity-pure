precision highp float;

uniform vec2 resolution;
uniform float time;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution;

    // Create animated gradient
    float t = time * 0.3;

    // Multiple color stops that flow
    vec3 color1 = vec3(0.2, 0.4, 0.8); // Blue
    vec3 color2 = vec3(0.8, 0.3, 0.5); // Pink
    vec3 color3 = vec3(0.3, 0.7, 0.5); // Green

    // Create flowing effect
    float wave1 = sin(uv.x * 3.0 + t) * 0.5 + 0.5;
    float wave2 = cos(uv.y * 2.0 - t * 0.7) * 0.5 + 0.5;
    float wave3 = sin((uv.x + uv.y) * 2.5 + t * 0.5) * 0.5 + 0.5;

    // Mix colors based on waves
    vec3 color = mix(color1, color2, wave1);
    color = mix(color, color3, wave2 * 0.6);

    // Add some movement
    color += vec3(wave3 * 0.1);

    // Darken slightly for background effect
    color *= 0.4;

    gl_FragColor = vec4(color, 1.0);
}
