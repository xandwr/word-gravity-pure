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
    const baseColor = $state<{ value: [number, number, number] }>({ value: [0.290, 0.050, 0.560] }); // Purple by default (neutral)

    // Track base color animation
    let baseColorAnimationId: number | null = null;

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

        get baseColor() {
            return baseColor.value;
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

        setBaseColor(color: [number, number, number]) {
            baseColor.value = color;
        },

        // Update base color based on score ratio (for gradual color shift)
        updateBaseColorFromScores(playerScore: number, opponentScore: number) {
            const playerColor: [number, number, number] = [0.133, 0.773, 0.369]; // #22c55e green-500
            const opponentColor: [number, number, number] = [0.937, 0.267, 0.267]; // #ef4444 red-500
            const purpleColor: [number, number, number] = [0.290, 0.050, 0.560]; // purple (neutral state)

            const totalScore = playerScore + opponentScore;

            // Calculate target color based on game state
            let targetColor: [number, number, number];
            let blendAmount: number; // How much to blend away from purple (0 = full purple, 1 = full color)

            if (totalScore === 0) {
                // No score yet - stay purple
                targetColor = purpleColor;
                blendAmount = 0;
            } else {
                // Calculate score difference - this is the key metric
                const scoreDiff = playerScore - opponentScore; // positive = player winning, negative = opponent winning
                const absDiff = Math.abs(scoreDiff);

                // AGGRESSIVE scaling: 10+ point difference = strong color shift
                if (absDiff < 5) {
                    // Very close game (< 5 points) - mostly purple with slight tint
                    blendAmount = 0.0 + (absDiff / 5) * 0.3; // 0.0 to 0.3
                } else if (absDiff < 10) {
                    // Getting a lead (5-10 points) - transition from purple to color
                    blendAmount = 0.3 + ((absDiff - 5) / 5) * 0.4; // 0.3 to 0.7
                } else if (absDiff < 20) {
                    // Clear lead (10-20 points) - mostly the winner's color
                    blendAmount = 0.7 + ((absDiff - 10) / 10) * 0.2; // 0.7 to 0.9
                } else {
                    // Dominating (20+ points) - completely the winner's color
                    blendAmount = 0.9 + Math.min(0.1, (absDiff - 20) / 30); // 0.9 to 1.0
                }

                // Determine which color to blend toward
                const winningColor = scoreDiff > 0 ? playerColor : opponentColor;

                // Blend from purple to the winning color
                targetColor = [
                    purpleColor[0] + (winningColor[0] - purpleColor[0]) * blendAmount,
                    purpleColor[1] + (winningColor[1] - purpleColor[1]) * blendAmount,
                    purpleColor[2] + (winningColor[2] - purpleColor[2]) * blendAmount
                ];
            }

            // Smoothly animate to the target color
            // Cancel any existing animation
            if (baseColorAnimationId !== null) {
                cancelAnimationFrame(baseColorAnimationId);
            }

            const startColor = baseColor.value;
            const startTime = performance.now();
            const duration = 600; // 0.6 second transition for more immediate feedback

            const animateColor = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1.0);

                // Smooth ease-out
                const eased = 1 - Math.pow(1 - progress, 3);

                // Lerp each color channel
                baseColor.value = [
                    startColor[0] + (targetColor[0] - startColor[0]) * eased,
                    startColor[1] + (targetColor[1] - startColor[1]) * eased,
                    startColor[2] + (targetColor[2] - startColor[2]) * eased
                ];

                if (progress < 1.0) {
                    baseColorAnimationId = requestAnimationFrame(animateColor);
                } else {
                    baseColorAnimationId = null;
                    baseColor.value = targetColor;
                }
            };

            baseColorAnimationId = requestAnimationFrame(animateColor);
        },

        // Trigger a color flash on the background shader with smooth animation
        triggerFlash(color: [number, number, number], duration: number = 500) {
            // Set the flash color
            flashColor.value = color;

            const startTime = performance.now();
            const startValue = flashIntensity.value;
            const targetValue = 0.6; // Peak intensity
            const decayDuration = duration * 0.7; // 70% of time for decay

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;

                if (elapsed < duration * 0.3) {
                    // Rise phase - quick rise to peak
                    const progress = elapsed / (duration * 0.3);
                    const eased = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
                    flashIntensity.value = startValue + (targetValue - startValue) * eased;
                    requestAnimationFrame(animate);
                } else if (elapsed < duration) {
                    // Decay phase - smooth decay to 0
                    const decayProgress = (elapsed - duration * 0.3) / decayDuration;
                    const eased = 1 - Math.pow(1 - decayProgress, 2); // Ease-out quad
                    flashIntensity.value = targetValue * (1 - eased);
                    requestAnimationFrame(animate);
                } else {
                    // Animation complete
                    flashIntensity.value = 0;
                }
            };
            requestAnimationFrame(animate);
        },

        // Pulse the contrast modifier with smooth animation
        pulseContrast(targetMod: number = 1.4, duration: number = 500) {
            const startTime = performance.now();
            const startValue = contrastMod.value;
            const peakValue = targetMod; // Peak contrast
            const decayDuration = duration * 0.75; // 75% of time for decay

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;

                if (elapsed < duration * 0.25) {
                    // Rise phase - quick rise to peak
                    const progress = elapsed / (duration * 0.25);
                    const eased = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
                    contrastMod.value = startValue + (peakValue - startValue) * eased;
                    requestAnimationFrame(animate);
                } else if (elapsed < duration) {
                    // Decay phase - smooth decay back to 1.0
                    const decayProgress = (elapsed - duration * 0.25) / decayDuration;
                    const eased = 1 - Math.pow(1 - decayProgress, 2); // Ease-out quad
                    contrastMod.value = peakValue + (1.0 - peakValue) * eased;
                    requestAnimationFrame(animate);
                } else {
                    // Animation complete
                    contrastMod.value = 1.0;
                }
            };
            requestAnimationFrame(animate);
        },

        // Pulse the spin speed modifier with smooth animation
        pulseSpin(targetMod: number = 1.6, duration: number = 500) {
            const startTime = performance.now();
            const startValue = spinMod.value;
            const peakValue = targetMod; // Peak spin speed
            const decayDuration = duration * 0.75; // 75% of time for decay

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;

                if (elapsed < duration * 0.25) {
                    // Rise phase - quick rise to peak
                    const progress = elapsed / (duration * 0.25);
                    const eased = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
                    spinMod.value = startValue + (peakValue - startValue) * eased;
                    requestAnimationFrame(animate);
                } else if (elapsed < duration) {
                    // Decay phase - smooth decay back to 1.0
                    const decayProgress = (elapsed - duration * 0.25) / decayDuration;
                    const eased = 1 - Math.pow(1 - decayProgress, 2); // Ease-out quad
                    spinMod.value = peakValue + (1.0 - peakValue) * eased;
                    requestAnimationFrame(animate);
                } else {
                    // Animation complete
                    spinMod.value = 1.0;
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
                baseColor: baseColor.value,
            };
        },

        // Reset all shader parameters to default
        resetColors() {
            // Cancel any ongoing animation
            if (baseColorAnimationId !== null) {
                cancelAnimationFrame(baseColorAnimationId);
                baseColorAnimationId = null;
            }

            // Reset to default purple color (neutral state)
            baseColor.value = [0.290, 0.050, 0.560];
            flashColor.value = [0.0, 0.0, 0.0];
            flashIntensity.value = 0.0;
            contrastMod.value = 1.0;
            spinMod.value = 1.0;
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
