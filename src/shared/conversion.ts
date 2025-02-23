/**
 * Converts an RGBA or RGB byte array to an array of ARGB integers.
 * @returns Array of 32-bit ARGB integers
 * @throws Error if buffer length isn't a multiple of 3 (RGB) or 4 (RGBA)
 * @param buffer
 */
export function convertToArgbIntArray(
  buffer: Uint8Array | Uint8ClampedArray | ArrayBuffer | number[]
): number[] {
  const byteArray = buffer instanceof ArrayBuffer
    ? new Uint8Array(buffer)
    : buffer;


  const length = byteArray.length;
  const pixelSize = length % 4 === 0 ? 4 : 3;

  if (length % pixelSize !== 0) {
    throw new Error(`Invalid buffer length ${length}: must be multiple of 3 (RGB) or 4 (RGBA)`);
  }

  const pixelCount = length / pixelSize;
  const result = new Array<number>(pixelCount);

  for (let src = 0, dst = 0; src < length; src += pixelSize, dst++) {
    result[dst] = (
      (pixelSize === 4 ? byteArray[src + 3] : 0xff) << 24 |
      byteArray[src] << 16 |
      byteArray[src + 1] << 8 |
      byteArray[src + 2]
    );
  }

  return result;
}

/**
 * Converts an array of 32-bit ARGB integers to a Uint8ClampedArray.
 * @returns Uint8ClampedArray of RGBA bytes
 * @param array Array of 32-bit ARGB integers
 */
export function convertToUint8ClampedArray(
  array: number[]
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(array.length * 4)
  for (let i = 0; i < array.length; i++) {
    result[i * 4] = (array[i] >> 16) & 0xff
    result[i * 4 + 1] = (array[i] >> 8) & 0xff
    result[i * 4 + 2] = array[i] & 0xff
    result[i * 4 + 3] = (array[i] >> 24) & 0xff
  }
  return result
}