import type { PixelData, PixeliftOptions } from 'pixelift';

async function blobToImageBitmap(
  blob: Blob,
  options: PixeliftOptions
): Promise<ImageBitmap> {
  // For SVG, some browsers don’t support direct createImageBitmap
  if (blob.type === 'image/svg+xml') {
    const url = URL.createObjectURL(blob);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.crossOrigin = 'anonymous';
        el.onload = (): void => resolve(el);
        el.onerror = (): void => reject(new Error('Failed to load SVG'));
        el.src = url;
      });
      const width = options.width ?? img.width;
      const height = options.height ?? img.height;
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to create canvas context');
      ctx.drawImage(img, 0, 0, width, height);
      return await createImageBitmap(canvas);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // For all other formats, direct createImageBitmap will handle orientation & colors
  return await createImageBitmap(blob, {
    imageOrientation: 'none',
    premultiplyAlpha: 'none',
    colorSpaceConversion: 'default',
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
    alpha: true,
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

  // 3. Configure unpacking
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  // 4. Create and bind texture
  const tex = gl.createTexture();
  if (!tex) throw new Error('Failed to create WebGL texture');
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // Upload the ImageBitmap into the texture
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);

  // 5. Create a simple shader & framebuffer-less draw (we can use the default framebuffer)
  //    We only need to draw a full-screen quad; if you're in need of shaders, you can bind a vertex buffer.
  //    But WebGL will sample the texture into the canvas implicitly if we just call readPixels.

  // Vertex shader: positions a quad covering clip space
  const vsSource = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

  // Fragment shader: samples the bound texture at v_uv
  const fsSource = `#version 300 es
precision highp float;
uniform sampler2D u_texture;
in vec2 v_uv;
out vec4 outColor;
void main() {
  outColor = texture(u_texture, v_uv);
}`;

  // Helper to compile a shader
  function compileShader(
    gl: WebGL2RenderingContext,
    source: string,
    type: number
  ): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Failed to create shader');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader compile failed: ${log}`);
    }
    return shader;
  }

  // Helper to link program
  function createProgram(
    gl: WebGL2RenderingContext,
    vs: WebGLShader,
    fs: WebGLShader
  ): WebGLProgram {
    const prog = gl.createProgram();
    if (!prog) throw new Error('Failed to create program');
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(prog);
      gl.deleteProgram(prog);
      throw new Error(`Program link failed: ${log}`);
    }
    return prog;
  }

  // Compile and link
  const vs = compileShader(gl, vsSource, gl.VERTEX_SHADER);
  const fs = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);
  const program = createProgram(gl, vs, fs);

  // Look up attribute/uniform locations
  const posLoc = gl.getAttribLocation(program, 'a_position');
  const texLoc = gl.getUniformLocation(program, 'u_texture');

  // Create a VAO for our quad
  const vao = gl.createVertexArray();
  if (!vao) throw new Error('Failed to create VAO');
  gl.bindVertexArray(vao);

  // Full-screen quad positions (two triangles)
  //   (-1, +1) ─── (+1, +1)
  //     │ \       │
  //     │  \      │
  //   (-1, -1) ─── (+1, -1)
  const vertexCoordinates = new Float32Array([
    -1, +1, -1, -1, +1, +1, +1, +1, -1, -1, +1, -1
  ]);
  const vbo = gl.createBuffer();
  if (!vbo) throw new Error('Failed to create VBO');
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, vertexCoordinates, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  // Bind texture unit 0
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);

  // Draw
  gl.useProgram(program);
  gl.uniform1i(texLoc, 0);
  gl.bindVertexArray(vao);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // 6. Read back pixels
  const rawBytes = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, rawBytes);

  // 7. The data from readPixels is bottom-to-top; flip it in JS to top-to-bottom.
  const rowBytes = width * 4;
  const flipped = new Uint8ClampedArray(rawBytes.length);
  for (let row = 0; row < height; row++) {
    const srcOffset = (height - 1 - row) * rowBytes;
    const dstOffset = row * rowBytes;
    flipped.set(rawBytes.subarray(srcOffset, srcOffset + rowBytes), dstOffset);
  }

  // 8. Return in Pixelift’s format
  return {
    data: flipped,
    width,
    height
  };
}
