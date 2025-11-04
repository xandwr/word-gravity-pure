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

        // Trigger a color flash on the background shader with cumulative random walk
        triggerFlash(color: [number, number, number], duration: number = 500) {
            // Set the flash color
            flashColor.value = color;

            const MIN_INTENSITY = 0.05; // Minimum baseline intensity
            const MAX_INTENSITY = 0.9; // Maximum intensity cap
            const MIN_CHANGE = 0.1; // Minimum random change amount
            const MAX_CHANGE = 0.45; // Maximum random change amount

            // Pick a random direction (positive or negative)
            const direction = Math.random() < 0.5 ? -1 : 1;

            // Pick a random intensity for this burst
            const changeAmount = MIN_CHANGE + Math.random() * (MAX_CHANGE - MIN_CHANGE);

            // Calculate new target value, clamped to min/max
            const currentValue = flashIntensity.value;
            const targetValue = Math.max(MIN_INTENSITY, Math.min(MAX_INTENSITY, currentValue + (direction * changeAmount)));

            const startTime = performance.now();
            const startValue = currentValue;
            let lastTime = startTime;

            const animate = (currentTime: number) => {
                const delta = (currentTime - lastTime) / 1000; // Delta in seconds
                lastTime = currentTime;

                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1.0);

                // Smooth ease-in-out to the new value
                const eased = progress < 0.5
                    ? 2 * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

                const intensity = startValue + (targetValue - startValue) * eased;

                // Lerp the intensity based on delta time for frame-rate independence
                const lerpFactor = Math.min(delta * 60, 1.0); // Normalize to 60fps
                flashIntensity.value = flashIntensity.value + (intensity - flashIntensity.value) * lerpFactor;

                if (progress < 1.0) {
                    requestAnimationFrame(animate);
                } else {
                    flashIntensity.value = targetValue;
                }
            };
            requestAnimationFrame(animate);
        },

        // Pulse the contrast modifier with cumulative random walk
        pulseContrast(targetMod: number = 1.4, duration: number = 500) {
            const MIN_CONTRAST = 0.6; // Minimum baseline contrast
            const MAX_CONTRAST = 2.4; // Maximum contrast cap
            const MIN_CHANGE = 0.12; // Minimum random change amount
            const MAX_CHANGE = 0.5; // Maximum random change amount

            // Pick a random direction (positive or negative)
            const direction = Math.random() < 0.5 ? -1 : 1;

            // Pick a random intensity for this burst
            const changeAmount = MIN_CHANGE + Math.random() * (MAX_CHANGE - MIN_CHANGE);

            // Calculate new target value, clamped to min/max
            const currentValue = contrastMod.value;
            const targetValue = Math.max(MIN_CONTRAST, Math.min(MAX_CONTRAST, currentValue + (direction * changeAmount)));

            const startTime = performance.now();
            const startValue = currentValue;
            let lastTime = startTime;

            const animate = (currentTime: number) => {
                const delta = (currentTime - lastTime) / 1000; // Delta in seconds
                lastTime = currentTime;

                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1.0);

                // Smooth ease-in-out to the new value
                const eased = progress < 0.5
                    ? 2 * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

                const contrast = startValue + (targetValue - startValue) * eased;

                // Lerp the value based on delta time for frame-rate independence
                const lerpFactor = Math.min(delta * 60, 1.0); // Normalize to 60fps
                contrastMod.value = contrastMod.value + (contrast - contrastMod.value) * lerpFactor;

                if (progress < 1.0) {
                    requestAnimationFrame(animate);
                } else {
                    contrastMod.value = targetValue;
                }
            };
            requestAnimationFrame(animate);
        },

        // Pulse the spin speed modifier with cumulative random walk
        pulseSpin(targetMod: number = 1.6, duration: number = 500) {
            const MIN_SPIN = 0.3; // Minimum baseline spin
            const MAX_SPIN = 2.8; // Maximum spin cap
            const MIN_CHANGE = 0.15; // Minimum random change amount
            const MAX_CHANGE = 0.6; // Maximum random change amount

            // Pick a random direction (positive or negative)
            const direction = Math.random() < 0.5 ? -1 : 1;

            // Pick a random intensity for this burst
            const changeAmount = MIN_CHANGE + Math.random() * (MAX_CHANGE - MIN_CHANGE);

            // Calculate new target value, clamped to min/max
            const currentValue = spinMod.value;
            const targetValue = Math.max(MIN_SPIN, Math.min(MAX_SPIN, currentValue + (direction * changeAmount)));

            const startTime = performance.now();
            const startValue = currentValue;
            let lastTime = startTime;

            const animate = (currentTime: number) => {
                const delta = (currentTime - lastTime) / 1000; // Delta in seconds
                lastTime = currentTime;

                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1.0);

                // Smooth ease-in-out to the new value
                const eased = progress < 0.5
                    ? 2 * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

                const spin = startValue + (targetValue - startValue) * eased;

                // Lerp the value based on delta time for frame-rate independence
                const lerpFactor = Math.min(delta * 60, 1.0); // Normalize to 60fps
                spinMod.value = spinMod.value + (spin - spinMod.value) * lerpFactor;

                if (progress < 1.0) {
                    requestAnimationFrame(animate);
                } else {
                    spinMod.value = targetValue;
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
