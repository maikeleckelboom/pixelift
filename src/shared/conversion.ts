/**
 * Converts an RGBA or RGB byte array to an array of ARGB integers.
 * @returns Array of 32-bit ARGB integers
 * @throws Error if buffer length isn't a multiple of 3 (RGB) or 4 (RGBA)
 * @param buffer
 */
export function convertToArgbIntArray(
  buffer: Uint8Array | Uint8ClampedArray
): number[] {
  const length = buffer.length;
  const isRGBA = length % 4 === 0;
  const pixelSize = isRGBA ? 4 : 3;

  if (length % pixelSize !== 0) {
    throw new Error("Buffer length must be multiple of 3 (RGB) or 4 (RGBA)");
  }

  const pixelCount = length / pixelSize;
  const result = new Array<number>(pixelCount);

  for (let src = 0, dst = 0; src < length; src += pixelSize, dst++) {
    result[dst] = (
      (pixelSize === 4 ? buffer[src + 3] : 0xff) << 24 |
      buffer[src] << 16 |
      buffer[src + 1] << 8 |
      buffer[src + 2]
    );
  }

  return result;
}

export function rgbaBufferToArgbIntArray(
  byteArray: Uint8Array | Uint8ClampedArray
): number[] {
  const result: number[] = []
  for (let i = 0; i < byteArray.length; i += 4) {
    result.push(
      (byteArray[i + 3] << 24) |
        (byteArray[i] << 16) |
        (byteArray[i + 1] << 8) |
        byteArray[i + 2]
    )
  }
  return result
}

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