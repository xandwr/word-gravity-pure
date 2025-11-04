/**
 * Global shader background store
 * Provides reactive state and hooks for controlling the background shader from any page
 */

import { loadShaderProgram, setupFullScreenQuad, createShaderAnimation, type ShaderUniforms } from "./shaderLoader";

// Reactive shader state
function createShaderBackgroundState() {
    // Shader control parameters
    const opacity = $state({ value: 0.5 });
    const flashColor = $state<{ value: [number, number, number] }>({ value: [0.0, 0.0, 0.0] });
    const flashIntensity = $state({ value: 0.0 });
    const contrastMod = $state({ value: 1.0 });
    const spinMod = $state({ value: 1.0 });

    return {
        // Getters for shader parameters
        get opacity() {
            return opacity.value;
        },

        get flashColor() {
            return flashColor.value;
        },

        get flashIntensity() {
            return flashIntensity.value;
        },

        get contrastMod() {
            return contrastMod.value;
        },

        get spinMod() {
            return spinMod.value;
        },

        // Setters for direct control
        setOpacity(value: number) {
            opacity.value = value;
        },

        setFlashColor(color: [number, number, number]) {
            flashColor.value = color;
        },

        setFlashIntensity(value: number) {
            flashIntensity.value = value;
        },

        setContrastMod(value: number) {
            contrastMod.value = value;
        },

        setSpinMod(value: number) {
            spinMod.value = value;
        },

        // Trigger a color flash on the background shader
        triggerFlash(color: [number, number, number], duration: number = 600) {
            // Set the flash color and intensity
            flashColor.value = color;

            const MIN_INTENSITY = 0.1; // Minimum baseline intensity
            const MAX_INTENSITY = 0.85; // Maximum intensity cap
            const BOOST_AMOUNT = 0.4; // How much to boost on each score

            const startTime = performance.now();
            const rampUpTime = 0.15; // Fast burst - 15% of duration
            const startIntensity = Math.max(MIN_INTENSITY, flashIntensity.value); // Start from current value
            const targetIntensity = Math.min(MAX_INTENSITY, startIntensity + BOOST_AMOUNT);
            let lastTime = startTime;

            const animate = (currentTime: number) => {
                const delta = (currentTime - lastTime) / 1000; // Delta in seconds
                lastTime = currentTime;

                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1.0);

                let intensity: number;
                if (progress < rampUpTime) {
                    // Fast ramp up - cubic ease-in for snappy start
                    const rampProgress = progress / rampUpTime;
                    const eased = rampProgress * rampProgress * rampProgress;
                    intensity = startIntensity + (targetIntensity - startIntensity) * eased;
                } else {
                    // Decay back to minimum, not zero
                    const decayProgress = (progress - rampUpTime) / (1 - rampUpTime);
                    const eased = Math.exp(-decayProgress * 3.5); // Exponential fade
                    intensity = MIN_INTENSITY + (targetIntensity - MIN_INTENSITY) * eased;
                }

                // Lerp the intensity based on delta time for frame-rate independence
                const lerpFactor = Math.min(delta * 60, 1.0); // Normalize to 60fps
                flashIntensity.value = flashIntensity.value + (intensity - flashIntensity.value) * lerpFactor;

                if (progress < 1.0) {
                    requestAnimationFrame(animate);
                } else {
                    flashIntensity.value = Math.max(MIN_INTENSITY, flashIntensity.value);
                }
            };
            requestAnimationFrame(animate);
        },

        // Pulse the contrast modifier
        pulseContrast(targetMod: number = 1.4, duration: number = 1200) {
            const MIN_CONTRAST = 1.0; // Minimum baseline contrast
            const MAX_CONTRAST = 2.0; // Maximum contrast cap
            const BOOST_AMOUNT = 0.35; // How much to boost on each score

            const startTime = performance.now();
            const rampUpTime = 0.15; // Fast burst like flash effect
            const startValue = Math.max(MIN_CONTRAST, contrastMod.value); // Start from current value
            const targetValue = Math.min(MAX_CONTRAST, startValue + BOOST_AMOUNT);
            let lastTime = startTime;

            const animate = (currentTime: number) => {
                const delta = (currentTime - lastTime) / 1000; // Delta in seconds
                lastTime = currentTime;

                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1.0);

                let contrast: number;
                if (progress < rampUpTime) {
                    // Fast ramp up - cubic ease-in for snappy start
                    const rampProgress = progress / rampUpTime;
                    const eased = rampProgress * rampProgress * rampProgress;
                    contrast = startValue + (targetValue - startValue) * eased;
                } else {
                    // Decay back to minimum, not 1.0
                    const decayProgress = (progress - rampUpTime) / (1 - rampUpTime);
                    const eased = Math.exp(-decayProgress * 3.5); // Exponential fade
                    contrast = MIN_CONTRAST + (targetValue - MIN_CONTRAST) * eased;
                }

                // Lerp the value based on delta time for frame-rate independence
                const lerpFactor = Math.min(delta * 60, 1.0); // Normalize to 60fps
                contrastMod.value = contrastMod.value + (contrast - contrastMod.value) * lerpFactor;

                if (progress < 1.0) {
                    requestAnimationFrame(animate);
                } else {
                    contrastMod.value = Math.max(MIN_CONTRAST, contrastMod.value);
                }
            };
            requestAnimationFrame(animate);
        },

        // Pulse the spin speed modifier
        pulseSpin(targetMod: number = 1.6, duration: number = 1400) {
            const MIN_SPIN = 1.0; // Minimum baseline spin
            const MAX_SPIN = 2.5; // Maximum spin cap
            const BOOST_AMOUNT = 0.5; // How much to boost on each score

            const startTime = performance.now();
            const rampUpTime = 0.15; // Fast burst like flash effect
            const startValue = Math.max(MIN_SPIN, spinMod.value); // Start from current value
            const targetValue = Math.min(MAX_SPIN, startValue + BOOST_AMOUNT);
            let lastTime = startTime;

            const animate = (currentTime: number) => {
                const delta = (currentTime - lastTime) / 1000; // Delta in seconds
                lastTime = currentTime;

                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1.0);

                let spin: number;
                if (progress < rampUpTime) {
                    // Fast ramp up - cubic ease-in for snappy start
                    const rampProgress = progress / rampUpTime;
                    const eased = rampProgress * rampProgress * rampProgress;
                    spin = startValue + (targetValue - startValue) * eased;
                } else {
                    // Decay back to minimum, not 1.0
                    const decayProgress = (progress - rampUpTime) / (1 - rampUpTime);
                    const eased = Math.exp(-decayProgress * 3.5); // Exponential fade
                    spin = MIN_SPIN + (targetValue - MIN_SPIN) * eased;
                }

                // Lerp the value based on delta time for frame-rate independence
                const lerpFactor = Math.min(delta * 60, 1.0); // Normalize to 60fps
                spinMod.value = spinMod.value + (spin - spinMod.value) * lerpFactor;

                if (progress < 1.0) {
                    requestAnimationFrame(animate);
                } else {
                    spinMod.value = Math.max(MIN_SPIN, spinMod.value);
                }
            };
            requestAnimationFrame(animate);
        },

        // Helper to convert hex color to RGB 0.0-1.0
        hexToRGB(hex: string): [number, number, number] {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            return [r, g, b];
        },

        // Get all uniforms for the shader
        getUniforms(): ShaderUniforms {
            return {
                opacity: opacity.value,
                flashColor: flashColor.value,
                flashIntensity: flashIntensity.value,
                contrastMod: contrastMod.value,
                spinMod: spinMod.value,
            };
        }
    };
}

// Export a singleton instance
export const shaderBackground = createShaderBackgroundState();

/**
 * Initialize the global shader background
 * This should be called once in the root layout
 */
export async function initializeShaderBackground(canvasId: string = "globalBackgroundCanvas") {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
        console.error(`Canvas with id "${canvasId}" not found`);
        return null;
    }

    const gl = canvas.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: false,
    }) || canvas.getContext("experimental-webgl", {
        alpha: true,
        premultipliedAlpha: false,
    }) as WebGLRenderingContext;

    if (!gl) {
        console.error("WebGL not supported");
        return null;
    }

    // Enable blending for opacity to work
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Load shader program from files
    const shaderProgram = await loadShaderProgram(
        gl,
        "/shaders/paint/vert.vert",
        "/shaders/paint/frag.frag"
    );

    if (!shaderProgram) {
        console.error("Failed to load shader program");
        return null;
    }

    const { program } = shaderProgram;
    gl.useProgram(program);

    // Set up full-screen quad
    setupFullScreenQuad(gl, program);

    // Start animation with dynamic uniforms callback
    const cleanup = createShaderAnimation(
        gl,
        program,
        canvas,
        undefined, // no custom updateUniforms
        () => shaderBackground.getUniforms()
    );

    return cleanup;
}
