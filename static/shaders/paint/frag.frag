precision mediump float;

uniform vec2 resolution;
uniform float time;
uniform float opacity; // uniform for opacity control (0.0-1.0)
uniform vec3 flashColor; // color to flash when player scores (RGB 0.0-1.0)
uniform float flashIntensity; // intensity of color flash (0.0-1.0)
uniform float contrastMod; // dynamic contrast modifier (0.0-2.0, default 1.0)
uniform float spinMod; // dynamic spin speed modifier (0.0-2.0, default 1.0)

// configuration constants
#define SPIN_ROTATION 2.0
#define SPIN_SPEED 4.0
#define OFFSET vec2(0.0)
#define COLOUR_1 vec4(0.050, 0.180, 0.400, 1.0) // deep space blue
#define COLOUR_2 vec4(0.290, 0.050, 0.560, 1.0) // violet nebula core
#define COLOUR_3 vec4(0.010, 0.020, 0.050, 1.0) // almost-black void
#define CONTRAST 1.0
#define LIGTHING 0.1
#define SPIN_AMOUNT 6.0
#define PIXEL_FILTER 512.0
#define SPIN_EASE 0.05
#define PI 3.14159265359
#define IS_ROTATE true

// ----------------------------------------------------------

vec4 effect(vec2 screenSize, vec2 screen_coords, float t) {
    float pixel_size = length(screenSize.xy) / PIXEL_FILTER;
    vec2 uv = (floor(screen_coords.xy * (1.0 / pixel_size)) * pixel_size - 0.5 * screenSize.xy) / length(screenSize.xy) - OFFSET;
    float uv_len = length(uv);
    
    float speed = (SPIN_ROTATION * SPIN_EASE * 0.2);
    if (IS_ROTATE) {
        speed = t * speed;
    }
    speed += 302.2;

    float new_pixel_angle = atan(uv.y, uv.x)
        + speed
        - SPIN_EASE * 20.0 * (SPIN_AMOUNT * uv_len + (1.0 - SPIN_AMOUNT));

    vec2 mid = (screenSize.xy / length(screenSize.xy)) / 2.0;
    uv = (vec2(uv_len * cos(new_pixel_angle) + mid.x, uv_len * sin(new_pixel_angle) + mid.y) - mid);
    
    uv *= 30.0;
    speed = t * SPIN_SPEED * spinMod; // apply dynamic spin modifier
    vec2 uv2 = vec2(uv.x + uv.y);

    for (int i = 0; i < 5; i++) {
        uv2 += sin(max(uv.x, uv.y)) + uv;
        uv  += 0.5 * vec2(
            cos(5.1123314 + 0.353 * uv2.y + speed * 0.131121),
            sin(uv2.x - 0.113 * speed)
        );
        uv  -= 1.0 * cos(uv.x + uv.y) - 1.0 * sin(uv.x * 0.711 - uv.y);
    }
    
    float contrast_mod = (0.25 * CONTRAST + 0.5 * SPIN_AMOUNT + 1.2) * contrastMod;
    float paint_res = min(2.0, max(0.0, length(uv) * 0.035 * contrast_mod));
    float c1p = max(0.0, 1.0 - contrast_mod * abs(1.0 - paint_res));
    float c2p = max(0.0, 1.0 - contrast_mod * abs(paint_res));
    float c3p = 1.0 - min(1.0, c1p + c2p);
    float light = (LIGTHING - 0.2) * max(c1p * 5.0 - 4.0, 0.0)
                + LIGTHING * max(c2p * 5.0 - 4.0, 0.0);
    
    vec4 baseColor = (0.3 / CONTRAST) * COLOUR_1
         + (1.0 - 0.3 / CONTRAST)
         * (COLOUR_1 * c1p + COLOUR_2 * c2p + vec4(c3p * COLOUR_3.rgb, c3p * COLOUR_1.a))
         + light;

    // Apply color flash effect (mix in the flash color)
    vec3 flashedColor = mix(baseColor.rgb, flashColor, flashIntensity);
    baseColor = vec4(flashedColor, baseColor.a);

    // Apply opacity to the final color alpha channel
    baseColor.a *= opacity;

    return baseColor;
}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 iResolution = resolution;
    float iTime = time;

    vec2 uv = fragCoord / iResolution.xy;
    vec4 color = effect(iResolution.xy, uv * iResolution.xy, iTime);
    gl_FragColor = color;
}
