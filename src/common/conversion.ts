/**
 * Converts an array of pixel values in ARGB format into a Uint8ClampedArray,
 * where each pixel is expanded into four separate channels: red, green, blue, and alpha.
 *
 * @param {ArrayLike<number>} pixels An array-like object containing pixel values in ARGB format.
 * @return {Uint8ClampedArray} A typed array where each ARGB pixel is unpacked into four consecutive channels.
 */
export function packPixels(pixels: ArrayLike<number>): Uint8ClampedArray {
  const count = pixels.length;
  const out = new Uint8ClampedArray(count * 4);

  for (let i = 0, j = 0; i < count; i++, j += 4) {
    const argb = pixels[i]! >>> 0;
    out[j] = (argb >>> 16) & 0xff;
    out[j + 1] = (argb >>> 8) & 0xff;
    out[j + 2] = argb & 0xff;
    out[j + 3] = (argb >>> 24) & 0xff;
  }

  return out;
}

/**
 * Unpacks pixel data from a buffer into an array of pixel values.
 * The number of channels per pixel (bytes per pixel) can be specified or
 * automatically detected.
 * Returns either a TypedArray or a plain array based on provided options.
 *
 * @param {Buffer | BufferSource} buffer The input buffer containing pixel data.
 * @param {Object} [options] Optional settings for pixel unpacking.
 * @param {3 | 4} [options.bytesPerPixel] - Number of bytes per pixel (3 for RGB, 4 for RGBA).
 * If not provided, it will be automatically determined.
 * @param {T extends boolean} [options.useTArray=false] A flag indicating whether to return a TypedArray
 * (Uint32Array) instead of a plain array of numbers.
 * @return {T extends boolean = false ? number[] : Uint32Array} A plain array or TypedArray of unpacked pixel values,
 * depending on the `useTArray` flag.
 */
export function unpackPixels<T extends boolean = false>(
  buffer: Buffer | BufferSource,
  options: {
    bytesPerPixel?: 3 | 4;
    useTArray?: T;
  } = {}
): T extends false ? number[] : Uint32Array {
  let { bytesPerPixel, useTArray = false as T } = options;

  const bytes =
    buffer instanceof ArrayBuffer
      ? new Uint8Array(buffer)
      : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  const len = bytes.length;

  // Enforce or detect bytesPerPixel
  if (bytesPerPixel) {
    if (len % bytesPerPixel !== 0) {
      throw new Error(`Invalid length ${len}: not a multiple of ${bytesPerPixel}`);
    }
  } else {
    const div3 = len % 3 === 0;
    const div4 = len % 4 === 0;
    // Prefer RGBA when both divide evenly
    if (div4) bytesPerPixel = 4;
    else if (div3) bytesPerPixel = 3;
    else throw new Error(`Invalid buffer length ${len}: must be multiple of 3 or 4`);
  }

  const count = len / bytesPerPixel;
  const result = new Uint32Array(count);

  for (let i = 0, j = 0; i < count; i++, j += bytesPerPixel) {
    const r = bytes[j]! & 0xff;
    const g = bytes[j + 1]! & 0xff;
    const b = bytes[j + 2]! & 0xff;
    const a = bytesPerPixel === 4 ? bytes[j + 3]! & 0xff : 0xff;

    // Build ARGB word, force to unsigned
    result[i] = ((a << 24) | (r << 16) | (g << 8) | b) >>> 0;
  }

  return (useTArray ? result : Array.from(result)) as T extends false ? number[] : Uint32Array;
}
