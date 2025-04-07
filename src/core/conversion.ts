/**
 * Converts 32-bit ARGB integers to RGBA bytes.
 *
 * @param pixels ARGB colors (0xAARRGGBB)
 * @returns RGBA pixels as bytes [R, G, B, A]
 * @example
 * packPixels([0xFFFF0000]) // Uint8ClampedArray [255, 0, 0, 255]
 */
export function packPixels(pixels: number[]): Uint8ClampedArray {
  const result = new Uint8ClampedArray(pixels.length * 4);
  for (let i = 0; i < pixels.length; i++) {
    result[i * 4] = (pixels[i]! >> 16) & 0xff;
    result[i * 4 + 1] = (pixels[i]! >> 8) & 0xff;
    result[i * 4 + 2] = pixels[i]! & 0xff;
    result[i * 4 + 3] = (pixels[i]! >> 24) & 0xff;
  }
  return result;
}

/**
 * Converts a pixel buffer (RGB/RGBA) to 32-bit ARGB integers. Automatically detects
 * format based on buffer length (RGB if length ÷ 3, RGBA if ÷ 4). RGB pixels become
 * fully opaque (alpha = 0xFF).
 *
 * @param buffer Input pixel data:
 * - ArrayBuffer: Converted to Uint8Array
 * - RGB: 3 bytes/pixel [R, G, B]
 * - RGBA: 4 bytes/pixel [R, G, B, A]
 * @returns ARGB colors as 32-bit integers (0xAARRGGBB)
 * @throws If buffer length isn't divisible by 3 or 4
 * @example
 * unpackPixels(new Uint8Array([255, 0, 0])) // [0xFFFF0000] (opaque red)
 */
export function unpackPixels(
  buffer: Uint8Array | Uint8ClampedArray | ArrayBuffer | number[],
): number[] {
  const byteArray = buffer instanceof ArrayBuffer
    ? new Uint8Array(buffer)
    : buffer;

  const length = byteArray.length;
  const pixelSize = length % 4 === 0 ? 4 : 3;

  if (length % pixelSize !== 0) {
    throw new Error(`Invalid buffer length ${length}: must be a multiple of 3 (RGB) or 4 (RGBA)`);
  }

  const pixelCount = length / pixelSize;
  const result = new Array<number>(pixelCount);

  for (let src = 0, dst = 0; src < length; src += pixelSize, dst++) {
    result[dst] = (
      (pixelSize === 4 ? byteArray[src + 3]! : 0xff) << 24 |
      byteArray[src]! << 16 |
      byteArray[src + 1]! << 8 |
      byteArray[src + 2]!
    )
  }

  return result;
}
