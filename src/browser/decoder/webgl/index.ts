import type { PixelData, PixeliftOptions } from 'pixelift';
import type { PixeliftBrowserOptions } from '../../types';

async function blobToImageBitmap(
  blob: Blob,
  options: PixeliftBrowserOptions = {}
): Promise<ImageBitmap> {
  if (blob.type === 'image/svg+xml') {
    throw new TypeError('SVG images are not supported for decoding via WebGL');
  }

  return await createImageBitmap(blob, {
    imageOrientation: 'none',
    premultiplyAlpha: 'none',
    colorSpaceConversion: 'none',
    resizeQuality: 'low',
    resizeWidth: options.width,
    resizeHeight: options.height
  });
}

export async function decode(
  blob: Blob | File,
  options: PixeliftOptions = {}
): Promise<PixelData> {
  // 1. Decode into ImageBitmap
  const bitmap = await blobToImageBitmap(blob, options);

  // Determine dimensions
  const width = options.width ?? bitmap.width;
  const height = options.height ?? bitmap.height;
  if (width <= 0 || height <= 0) {
    throw new TypeError('Invalid image dimensions');
  }

  // 2. Set up OffscreenCanvas & WebGL2 context
  const canvas = new OffscreenCanvas(width, height);
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    premultipliedAlpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false
  });
  if (!gl) {
    throw new Error('WebGL2 not supported');
  }

  gl.viewport(0, 0, width, height);

  // 3. Configure unpacking (no flip)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

  // 4. Create and bind texture
  const tex = gl.createTexture();
  if (!tex) throw new Error('Failed to create WebGL texture');
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // Upload the ImageBitmap into the texture using RGBA8 internal format
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);

  // 5. Create shaders with optimized vertex generation and flipped sampling
  const vsSource = `#version 300 es
  out vec2 v_uv;
  void main() {
    int vertexID = gl_VertexID;
    vec2 pos;
    if (vertexID == 0)      pos = vec2(-1.0, 1.0);
    else if (vertexID == 1) pos = vec2(-1.0, -1.0);
    else if (vertexID == 2) pos = vec2(1.0, 1.0);
    else if (vertexID == 3) pos = vec2(1.0, 1.0);
    else if (vertexID == 4) pos = vec2(-1.0, -1.0);
    else                    pos = vec2(1.0, -1.0);
    gl_Position = vec4(pos, 0.0, 1.0);
    v_uv = (pos + 1.0) * 0.5;
  }`;

  const fsSource = `#version 300 es
  precision mediump float;
  uniform sampler2D u_texture;
  in vec2 v_uv;
  out vec4 outColor;
  void main() {
    outColor = texture(u_texture, vec2(v_uv.x, 1.0 - v_uv.y));
  }`;

  // Compile shaders and link program
  const compileShader = (source: string, type: number): WebGLShader => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Failed to create shader');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(`Shader compile error: ${gl.getShaderInfoLog(shader)}`);
    }
    return shader;
  };

  const vs = compileShader(vsSource, gl.VERTEX_SHADER);
  const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Program link error: ${gl.getProgramInfoLog(program)}`);
  }

  // 6. Execute draw call
  gl.useProgram(program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // 7. Read pixels directly into clamped array
  const data = new Uint8ClampedArray(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);

  // 8. Cleanup WebGL resources
  gl.deleteTexture(tex);
  gl.deleteProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  return { data, width, height };
}
