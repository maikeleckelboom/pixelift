import type { PixelData } from '../../../types';
import type { BrowserOptions } from '../../types';

export async function isSupported(type: string): Promise<boolean> {
  return (
    'ImageDecoder' in window &&
    typeof ImageDecoder.isTypeSupported === 'function' &&
    (await ImageDecoder.isTypeSupported(type))
  );
}

export async function decode(
  blob: Blob | File,
  _options?: BrowserOptions
): Promise<PixelData> {
  const buffer = await blob.arrayBuffer();

  const decoder = new ImageDecoder({
    type: blob.type,
    data: buffer,
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
