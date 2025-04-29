/**
 * Converts an array-like structure of integer pixels into a Uint8ClampedArray with RGBA components.
 * Each input pixel is expected to represent a 32-bit ARGB value packed into a single integer.
 * The output array contains the unpacked RGBA values in sequential order.
 *
 * @param {ArrayLike<number>} pixels - An array-like structure containing 32-bit integer ARGB pixels.
 * Each integer represents one pixel with alpha, red, green, and blue components packed into it.
 *
 * @return {Uint8ClampedArray} A new Uint8ClampedArray where each input pixel is expanded into
 * four elements (red, green, blue, and alpha), corresponding to the RGBA components.
 */
export function packPixels(pixels: ArrayLike<number>): Uint8ClampedArray {
  const count = pixels.length;
  const out = new Uint8ClampedArray(count * 4);

  for (let i = 0, j = 0; i < count; i++, j += 4) {
    const argb = (pixels[i] || 0) >>> 0;
    out[j] = (argb >>> 16) & 0xff;
    out[j + 1] = (argb >>> 8) & 0xff;
    out[j + 2] = argb & 0xff;
    out[j + 3] = (argb >>> 24) & 0xff;
  }

  return out;
}

/**
 * Unpacks pixel data from a buffer into an array of pixels.
 * Each pixel is represented as a 32-bit integer with the RGBA components packed.
 *
 * @param {BufferSource | Buffer} buffer The buffer containing pixel data in RGBA format.
 * @param {Object} [options] Optional unpacking options.
 * @param {boolean} [options.useTArray=true] Indicates if a typed array (Uint32Array) should be returned.
 * If false, a standard JavaScript array is returned.
 * @param {number} [options.width] The width of the image in pixels. Used to calculate the number of pixels.
 * @param {number} [options.height] The height of the image in pixels. Used to calculate the number of pixels.
 * @return {T extends true ? Uint32Array : number[]} An array of unpacked pixels.
 * If `useTArray` is true, returns a `Uint32Array`; otherwise, returns a standard array of numbers.
 */
export function unpackPixels<T extends boolean = true>(
  buffer: BufferSource | Buffer,
  options: {
    useTArray?: T;
    width?: number;
    height?: number;
  } = {}
): T extends true ? Uint32Array : number[] {
  let data: Uint8Array;
  if (buffer instanceof ArrayBuffer) {
    data = new Uint8Array(buffer);
  } else if (ArrayBuffer.isView(buffer)) {
    data = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  } else {
    throw new Error('Invalid input type for bytes');
  }

  const { width, height, useTArray } = options || {};

  const bytesPerPixel = 4 as const;
  const pixelCount =
    width && height ? width * height : Math.floor(data.length / bytesPerPixel);

  if (width && height && data.length < width * height * bytesPerPixel) {
    throw new Error('Buffer is too small for the specified dimensions');
  }

  const readRGBA = (
    data: Uint8Array,
    byteOffset: number
  ): [number, number, number, number] =>
    [
      data[byteOffset],
      data[byteOffset + 1],
      data[byteOffset + 2],
      data[byteOffset + 3]
    ] as [number, number, number, number];

  const pixels = useTArray ? new Uint32Array(pixelCount) : new Array(pixelCount);

  for (let i = 0; i < pixelCount; i++) {
    const byteOffset = i * bytesPerPixel;

    if (byteOffset + 3 >= data.length) {
      break;
    }

    const [red, green, blue, alpha] = readRGBA(data, byteOffset);

    pixels[i] = ((alpha << 24) | (red << 16) | (green << 8) | blue) >>> 0;
  }

  return pixels as T extends true ? Uint32Array : number[];
}
