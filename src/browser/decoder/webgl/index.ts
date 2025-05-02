import type { PixelData, PixeliftBrowserOptions } from '../../types';

async function blobToImageBitmap(blob: Blob): Promise<ImageBitmap> {
  return await createImageBitmap(blob, {
    imageOrientation: 'none',
    premultiplyAlpha: 'none',
    colorSpaceConversion: 'none'
  });
}

const webGLCache = new Map<
  string,
  {
    canvas: OffscreenCanvas;
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    tex: WebGLTexture;
  }
>();

export async function decode(
  blob: Blob | File,
  _options?: PixeliftBrowserOptions
): Promise<PixelData> {
  const bitmap = await blobToImageBitmap(blob);
  const { width, height } = bitmap;
  const key = `${width}x${height}`;

  let entry = webGLCache.get(key);

  if (!entry) {
    const canvas = new OffscreenCanvas(width, height);
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      premultipliedAlpha: false,
      antialias: false,
      preserveDrawingBuffer: false
    });

    if (!gl) {
      throw new Error('Failed to create WebGL2 context');
    }

    const vsSource = `#version 300 es
    void main() {
      vec2 pos = vec2(
        float((gl_VertexID & 1) << 1) - 1.0,
        float((gl_VertexID >> 1) << 1) - 1.0
      );
      gl_Position = vec4(pos, 0.0, 1.0);
    }`;

    const fsSource = `#version 300 es
    precision highp float;
    uniform sampler2D u_texture;
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
      return shader;
    }

    const program = gl.createProgram() as WebGLProgram;
    gl.attachShader(program, compileShader(vsSource, gl.VERTEX_SHADER));
    gl.attachShader(program, compileShader(fsSource, gl.FRAGMENT_SHADER));
    gl.linkProgram(program);

    // Create and configure texture
    const tex = gl.createTexture() as WebGLTexture;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    entry = { canvas, gl, program, tex };
    webGLCache.set(key, entry);
  }

  const { gl, program, tex } = entry;

  gl.viewport(0, 0, width, height);

  // Upload
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);

  // Render
  gl.useProgram(program);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  // Read
  const data = new Uint8ClampedArray(width * height * 4);
  gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);

  return { data, width, height };
}

export function isSupported(_type?: string): Promise<boolean> {
  return Promise.resolve(
    'OffscreenCanvas' in window &&
      'WebGL2RenderingContext' in window &&
      typeof createImageBitmap === 'function'
  );
}
