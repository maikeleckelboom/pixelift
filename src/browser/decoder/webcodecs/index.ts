import type { PixelData, PixeliftOptions } from 'pixelift';

export async function decode(
  blob: Blob | File,
  options: PixeliftOptions = {}
): Promise<PixelData> {
  const buffer = await blob.arrayBuffer();
  const decoder = new ImageDecoder({
    type: blob.type,
    data: buffer,
    desiredWidth: options.width,
    desiredHeight: options.height,
    colorSpaceConversion: 'none'
  });

  await decoder.completed;

  const { image: frame } = await decoder.decode();

  const byteLength = frame.allocationSize({ format: 'RGBA' });

  const data = new Uint8ClampedArray(byteLength);
  await frame.copyTo(data, { format: 'RGBA', colorSpace: 'srgb' });

  const width = frame.codedWidth;
  const height = frame.codedHeight;

  frame.close();
  decoder.close();

  return { data, width, height };
}
