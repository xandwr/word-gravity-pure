/**
 * Shader loader utility for WebGL shaders
 */

export interface ShaderProgram {
    program: WebGLProgram;
    vertexShader: WebGLShader;
    fragmentShader: WebGLShader;
}

/**
 * Compile a shader from source
 */
function compileShader(gl: WebGLRenderingContext, source: string, type: number): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) {
        console.error('Failed to create shader');
        return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const shaderType = type === gl.VERTEX_SHADER ? 'vertex' : 'fragment';
        console.error(`${shaderType} shader compile error:`, gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

/**
 * Create a WebGL program from vertex and fragment shader sources
 */
export function createShaderProgram(
    gl: WebGLRenderingContext,
    vertexSource: string,
    fragmentSource: string
): ShaderProgram | null {
    const vertexShader = compileShader(gl, vertexSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fragmentSource, gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) {
        return null;
    }

    const program = gl.createProgram();
    if (!program) {
        console.error('Failed to create program');
        return null;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    return {
        program,
        vertexShader,
        fragmentShader
    };
}

/**
 * Load shader files and create a WebGL program
 */
export async function loadShaderProgram(
    gl: WebGLRenderingContext,
    vertexPath: string,
    fragmentPath: string
): Promise<ShaderProgram | null> {
    try {
        const [vertexResponse, fragmentResponse] = await Promise.all([
            fetch(vertexPath),
            fetch(fragmentPath)
        ]);

        if (!vertexResponse.ok || !fragmentResponse.ok) {
            console.error('Failed to load shader files');
            return null;
        }

        const [vertexSource, fragmentSource] = await Promise.all([
            vertexResponse.text(),
            fragmentResponse.text()
        ]);

        return createShaderProgram(gl, vertexSource, fragmentSource);
    } catch (error) {
        console.error('Error loading shaders:', error);
        return null;
    }
}

/**
 * Set up a full-screen quad for shader rendering
 */
export function setupFullScreenQuad(gl: WebGLRenderingContext, program: WebGLProgram): void {
    const vertices = new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        1, 1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
}

export interface ShaderUniforms {
    opacity?: number;
    flashColor?: [number, number, number];
    flashIntensity?: number;
    contrastMod?: number;
    spinMod?: number;
    baseColor?: [number, number, number];
}

/**
 * Create an animation loop for a shader
 */
export function createShaderAnimation(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    canvas: HTMLCanvasElement,
    updateUniforms?: (time: number) => void,
    getUniforms?: () => ShaderUniforms // callback to get all dynamic uniforms
): () => void {
    const resolutionLocation = gl.getUniformLocation(program, 'resolution');
    const timeLocation = gl.getUniformLocation(program, 'time');
    const opacityLocation = gl.getUniformLocation(program, 'opacity');
    const flashColorLocation = gl.getUniformLocation(program, 'flashColor');
    const flashIntensityLocation = gl.getUniformLocation(program, 'flashIntensity');
    const contrastModLocation = gl.getUniformLocation(program, 'contrastMod');
    const spinModLocation = gl.getUniformLocation(program, 'spinMod');
    const baseColorLocation = gl.getUniformLocation(program, 'baseColor');

    // Resize handler
    function resize() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
        if (resolutionLocation) {
            gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        }
    }

    resize();
    window.addEventListener('resize', resize);

    // Animation loop
    const startTime = Date.now();
    let animationId: number;

    function render() {
        const time = (Date.now() - startTime) * 0.001; // seconds

        if (timeLocation) {
            gl.uniform1f(timeLocation, time);
        }

        // Get all dynamic uniforms
        const uniforms = getUniforms ? getUniforms() : {};

        // Update all uniform values
        if (opacityLocation) {
            gl.uniform1f(opacityLocation, uniforms.opacity ?? 0.5);
        }

        if (flashColorLocation) {
            const color = uniforms.flashColor ?? [0.0, 0.0, 0.0];
            gl.uniform3f(flashColorLocation, color[0], color[1], color[2]);
        }

        if (flashIntensityLocation) {
            gl.uniform1f(flashIntensityLocation, uniforms.flashIntensity ?? 0.0);
        }

        if (contrastModLocation) {
            gl.uniform1f(contrastModLocation, uniforms.contrastMod ?? 1.0);
        }

        if (spinModLocation) {
            gl.uniform1f(spinModLocation, uniforms.spinMod ?? 1.0);
        }

        if (baseColorLocation) {
            const color = uniforms.baseColor ?? [0.0, 0.0, 0.0];
            gl.uniform3f(baseColorLocation, color[0], color[1], color[2]);
        }

        if (updateUniforms) {
            updateUniforms(time);
        }

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        animationId = requestAnimationFrame(render);
    }

    render();

    // Cleanup
    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationId);
    };
}
