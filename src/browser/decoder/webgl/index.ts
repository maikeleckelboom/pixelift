import type { PixelData, PixeliftBrowserOptions } from '../../types';

interface GLResources {
  canvas: OffscreenCanvas;
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  inputTex: WebGLTexture;
  outputTex: WebGLTexture;
  framebuffer: WebGLFramebuffer;
}

let glResources: GLResources | null = null;

export async function decode(
  blob: Blob | File,
  _options?: PixeliftBrowserOptions
): Promise<PixelData> {
  const bitmap = await createImageBitmap(blob, {
    imageOrientation: 'none',
    premultiplyAlpha: 'none',
    colorSpaceConversion: 'none'
  });
  const { width, height } = bitmap;

  // Create or update WebGL resources
  if (!glResources) {
    const canvas = new OffscreenCanvas(width, height);

    const gl = canvas.getContext('webgl2', {
      alpha: false,
      premultipliedAlpha: false,
      antialias: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    });

    if (!gl) {
      throw new Error('Unable to create WebGL2 context');
    }

    gl.getExtension('EXT_color_buffer_float');

    // Shader program setup
    const vsSrc = `#version 300 es
            out vec2 v_uv;
            void main() {
                vec2 pos = vec2(
                    float((gl_VertexID & 1) << 1) - 1.0,
                    float((gl_VertexID >> 1) << 1) - 1.0
                );
                v_uv = pos * 0.5 + 0.5;
                gl_Position = vec4(pos, 0.0, 1.0);
            }`;
    const fsSrc = `#version 300 es
            precision highp float;
            uniform sampler2D u_texture;
            in vec2 v_uv;
            out vec4 outColor;
            void main() {
                outColor = texture(u_texture, v_uv);
            }`;

    const compileShader = (src: string, type: GLenum): WebGLShader => {
      const shader = gl.createShader(type) as WebGLShader;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Shader compile error: ${log}`);
      }
      return shader;
    };

    const program = gl.createProgram() as WebGLProgram;
    gl.attachShader(program, compileShader(vsSrc, gl.VERTEX_SHADER));
    gl.attachShader(program, compileShader(fsSrc, gl.FRAGMENT_SHADER));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Program link error: ${gl.getProgramInfoLog(program)}`);
    }

    // Vertex array setup
    const vao = gl.createVertexArray() as WebGLVertexArrayObject;
    gl.bindVertexArray(vao);

    // Texture setup
    const inputTex = gl.createTexture() as WebGLTexture;
    const outputTex = gl.createTexture() as WebGLTexture;
    gl.bindTexture(gl.TEXTURE_2D, outputTex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, width, height);

    [inputTex, outputTex].forEach((tex) => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    });

    // Framebuffer setup
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      outputTex,
      0
    );

    glResources = { canvas, gl, program, vao, inputTex, outputTex, framebuffer };
  } else if (glResources.canvas.width !== width || glResources.canvas.height !== height) {
    // Resize existing resources
    const { gl, outputTex, framebuffer } = glResources;
    glResources.canvas.width = width;
    glResources.canvas.height = height;

    // Recreate output texture and framebuffer
    gl.deleteTexture(outputTex);
    gl.deleteFramebuffer(framebuffer);

    const newOutputTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, newOutputTex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, width, height);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const newFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, newFramebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      newOutputTex,
      0
    );

    glResources.outputTex = newOutputTex;
    glResources.framebuffer = newFramebuffer;
  }

  const { gl, program, vao, inputTex, framebuffer } = glResources;

  // Upload image
  gl.bindTexture(gl.TEXTURE_2D, inputTex);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);

  // Render to framebuffer
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.viewport(0, 0, width, height);
  gl.useProgram(program);
  gl.bindVertexArray(vao);

  const loc = gl.getUniformLocation(program, 'u_texture');
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, inputTex);
  gl.uniform1i(loc, 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  // Read pixels directly
  const data = new Uint8ClampedArray(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);

  // Cleanup
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindVertexArray(null);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return { data, width, height };
}

export function isSupported(_type?: string): Promise<boolean> {
  try {
    const testCanvas = new OffscreenCanvas(1, 1);
    const testContext = testCanvas.getContext('webgl2');
    return Promise.resolve(
      !!testContext &&
        typeof OffscreenCanvas !== 'undefined' &&
        typeof WebGL2RenderingContext !== 'undefined' &&
        typeof createImageBitmap === 'function'
    );
  } catch {
    return Promise.resolve(false);
  }
}
