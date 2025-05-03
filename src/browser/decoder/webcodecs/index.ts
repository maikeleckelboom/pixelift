import type { PixelData } from 'pixelift';
import type { BrowserOptions } from '../../types';

export async function decode(
  blob: Blob | File,
  { signal }: BrowserOptions = {}
): Promise<PixelData> {
  const buffer = await blob.arrayBuffer();

  signal?.throwIfAborted();

  const decoder = new ImageDecoder({
    type: blob.type,
    data: buffer,
    colorSpaceConversion: 'none'
  });

  await decoder.completed;

  const { image: frame } = await decoder.decode({ frameIndex: 0 });

  const byteLength = frame.allocationSize({ format: 'RGBA' });

  const data = new Uint8ClampedArray(byteLength);
  await frame.copyTo(data, { format: 'RGBA', colorSpace: 'srgb' });

  const width = frame.codedWidth;
  const height = frame.codedHeight;

  frame.close();
  decoder.close();

  return { data, width, height };
}

export async function isSupported(type: string): Promise<boolean> {
  return (
    'ImageDecoder' in window &&
    typeof ImageDecoder.isTypeSupported === 'function' &&
    (await ImageDecoder.isTypeSupported(type))
  );
}
