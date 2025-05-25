/**
 * Converts an array-like structure of integer pixels into a Uint8ClampedArray with RGBA components.
 * Each input pixel is expected to represent a 32-bit ARGB value packed into a single integer.
 * The output array contains the unpacked RGBA values in sequential order.
 *
 * @param {ArrayLike<number>} argbPixels - An array-like structure containing 32-bit integer ARGB pixels.
 * Each integer represents one pixel with alpha, red, green, and blue components packed into it.
 *
 * @return {Uint8ClampedArray} A new Uint8ClampedArray where each input pixel is expanded into
 * four elements (red, green, blue, and alpha), corresponding to the RGBA components.
 */
export function rgbaBytesFromArgb(argbPixels: ArrayLike<number>): Uint8ClampedArray {
  const pixelCount = argbPixels.length;
  const rgbaBytes = new Uint8ClampedArray(pixelCount * 4);

  for (
    let pixelIndex = 0, byteIndex = 0;
    pixelIndex < pixelCount;
    pixelIndex++, byteIndex += 4
  ) {
    const argb = (argbPixels[pixelIndex] ?? 0) >>> 0;
    rgbaBytes[byteIndex] = (argb >>> 16) & 0xff; // Red
    rgbaBytes[byteIndex + 1] = (argb >>> 8) & 0xff; // Green
    rgbaBytes[byteIndex + 2] = argb & 0xff; // Blue
    rgbaBytes[byteIndex + 3] = (argb >>> 24) & 0xff; // Alpha
  }

  return rgbaBytes;
}

export interface UnpackOptions<T extends boolean> {
  /** If true, returns a typed array (Uint32Array), otherwise returns a standard array */
  useTypedArray?: T;
  /** Required for dimension validation */
  width?: number;
  /** Required for dimension validation */
  height?: number;
}

/**
 * Unpacks RGBA pixel data from a buffer into an array of ARGB values.
 * Depending on the `useTypedArray` option, the method will return either a `Uint32Array` or a standard array of numbers.
 *
 * @param {BufferSource | Buffer} rgbaByteBuffer - The input buffer containing RGBA pixel data.
 *                                              Can be an `ArrayBuffer`, a typed array view, or an instance of `Buffer`.
 * @param {UnpackOptions<T extends boolean>} [options] - Optional parameters for unpacking.
 * @param {number} [options.width] - The width of the image in pixels. Required if buffer size is ambiguous.
 * @param {number} [options.height] - The height of the image in pixels. Required if buffer size is ambiguous.
 * @param {T extends boolean} [options.useTypedArray=true] - Indicates whether to return a typed array (`Uint32Array`) or a standard array (`Array<number>`).
 *                                        Defaults to `true` (returns `Uint32Array`).
 * @return {T extends true ? Uint32Array : number[]} An array of ARGB values representing the unpacked pixel data.
 *                                                   Returns a `Uint32Array` if `useTypedArray` is `true`, otherwise returns a standard array of numbers.
 */
export function argbFromRgbaBytes<T extends boolean = false>(
  rgbaByteBuffer: BufferSource | Buffer,
  options: UnpackOptions<T> = {}
): T extends true ? Uint32Array : number[] {
  let data: Uint8Array;
  if (rgbaByteBuffer instanceof ArrayBuffer) {
    data = new Uint8Array(rgbaByteBuffer);
  } else if (ArrayBuffer.isView(rgbaByteBuffer)) {
    data = new Uint8Array(
      rgbaByteBuffer.buffer,
      rgbaByteBuffer.byteOffset,
      rgbaByteBuffer.byteLength
    );
  } else {
    throw new TypeError(
      `Expected ArrayBuffer, TypedArray, or Buffer, but received ${typeof rgbaByteBuffer}`
    );
  }

  const { width, height, useTypedArray } = options || {};

  const bytesPerPixel = 4 as const;
  const pixelCount =
    width && height ? width * height : Math.floor(data.length / bytesPerPixel);

  if (width && height && data.length < width * height * bytesPerPixel) {
    throw new RangeError(
      `Buffer length ${data.length} is too short for dimensions ${width}x${height} with ${bytesPerPixel} bytes per pixel`
    );
  }

  const readRgbaComponents = (
    data: Uint8Array,
    byteOffset: number
  ): [number, number, number, number] =>
    [
      data[byteOffset],
      data[byteOffset + 1],
      data[byteOffset + 2],
      data[byteOffset + 3]
    ] as [number, number, number, number];

  const pixels = useTypedArray ? new Uint32Array(pixelCount) : new Array(pixelCount);

  for (let i = 0; i < pixelCount; i++) {
    const byteOffset = i * bytesPerPixel;

    const [red, green, blue, alpha] = readRgbaComponents(data, byteOffset);

    pixels[i] = ((alpha << 24) | (red << 16) | (green << 8) | blue) >>> 0;
  }

  return pixels as T extends true ? Uint32Array : number[];
}
