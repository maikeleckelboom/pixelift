import type { PixelData, PixeliftBrowserOptions } from '../../types';

const webGLCache = new Map<
  string,
  {
    canvas: OffscreenCanvas;
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    vao: WebGLVertexArrayObject;
    tex: WebGLTexture;
    framebuffer: WebGLFramebuffer;
    pbo: WebGLBuffer;
  }
>();

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
  const key = `${width}x${height}`;

  let entry = webGLCache.get(key);

  if (!entry) {
    const canvas = new OffscreenCanvas(width, height);
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      premultipliedAlpha: false,
      antialias: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    });

    if (!gl) {
      throw new Error('Failed to create WebGL2 context');
    }

    // Enable required extensions
    gl.getExtension('EXT_color_buffer_float');

    const vsSource = `#version 300 es
    out vec2 v_uv;
    void main() {
      // Generate full-screen quad vertices efficiently using vertex ID
      vec2 pos = vec2(
        float((gl_VertexID & 1) << 1) - 1.0,
        float((gl_VertexID >> 1) << 1) - 1.0
      );
      v_uv = pos * 0.5 + 0.5;
      gl_Position = vec4(pos, 0.0, 1.0);
    }`;

    const fsSource = `#version 300 es
    precision highp float;
    uniform sampler2D u_texture;
    in vec2 v_uv;
    out vec4 outColor;
    void main() {
      outColor = texture(u_texture, vec2(v_uv.x, 1.0 - v_uv.y));
    }`;

    function compileShader(source: string, type: number): WebGLShader {
      if (!gl) throw new Error('WebGL context is not available');
      const shader = gl.createShader(type);
      if (!shader) throw new Error('Shader creation failed');
      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Shader compilation failed: ${info}`);
      }

      return shader;
    }

    const program = gl.createProgram() as WebGLProgram;
    const vertexShader = compileShader(vsSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fsSource, gl.FRAGMENT_SHADER);

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`Program linking failed: ${info}`);
    }

    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    // Create VAO for the quad
    const vao = gl.createVertexArray() as WebGLVertexArrayObject;
    gl.bindVertexArray(vao);

    // Create texture
    const tex = gl.createTexture() as WebGLTexture;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const framebuffer = gl.createFramebuffer() as WebGLFramebuffer;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    // Allocate texture storage
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, width, height);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

    // Create Pixel Buffer Object for faster pixel readback
    const pbo = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbo);
    gl.bufferData(gl.PIXEL_PACK_BUFFER, width * height * 4, gl.STREAM_READ);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);

    entry = { canvas, gl, program, vao, tex, framebuffer, pbo };
    webGLCache.set(key, entry);
  }

  const { gl, program, vao, tex, framebuffer, pbo } = entry;

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.viewport(0, 0, width, height);

  // Upload texture data
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);

  // Render to framebuffer
  gl.useProgram(program);
  gl.bindVertexArray(vao);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  // Set up PBO for reading
  gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbo);
  gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, 0);

  // Create result data array
  const data = new Uint8ClampedArray(width * height * 4);

  // Read from PBO to client memory
  gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbo);
  gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, data);
  gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);

  // Clean up
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
        'OffscreenCanvas' in window &&
        'WebGL2RenderingContext' in window &&
        typeof createImageBitmap === 'function'
    );
  } catch {
    return Promise.resolve(false);
  }
}
