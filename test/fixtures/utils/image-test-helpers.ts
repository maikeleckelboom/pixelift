import sharp, { type FormatEnum } from 'sharp';

/**
 * Generates a simple test image buffer using sharp.
 * @param width The width of the image.
 * @param height The height of the image.
 * @param channels The number of channels (e.g., 4 for RGBA).
 * @param background The background color object for sharp.
 * @param format
 * @returns A Promise resolving to a Buffer containing the PNG image data.
 */
export async function generateTestImageBuffer(
  width: number = 2,
  height: number = 2,
  channels: 3 | 4 = 4,
  background = { r: 255, g: 0, b: 0, alpha: 1 },
  format: keyof FormatEnum = 'png'
): Promise<Buffer> {
  const init = sharp({
    create: {
      width,
      height,
      channels,
      background
    }
  });
  return init
    .toFormat(format)
    .png({ compressionLevel: 0 })
    .jpeg({ quality: 100 })
    .toBuffer();
}
