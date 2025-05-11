import type { PixelData } from '../../../types';
import type { BrowserOptions } from '../../types';
import { imageDecoderOptions } from './options';

export async function isSupported(type: string): Promise<boolean> {
  return (
    'ImageDecoder' in window &&
    typeof ImageDecoder.isTypeSupported === 'function' &&
    (await ImageDecoder.isTypeSupported(type))
  );
}

export async function decode(blob: Blob, _options?: BrowserOptions): Promise<PixelData> {
  const arrayBuffer = await blob.arrayBuffer();
  const decoder = new ImageDecoder(imageDecoderOptions(arrayBuffer, blob.type));

  await decoder.completed;

  const { image: frame } = await decoder.decode({
    frameIndex: 0
  });

  const byteLength = frame.allocationSize({ format: 'RGBA' });

  const data = new Uint8ClampedArray(byteLength);
  await frame.copyTo(data, { format: 'RGBA', colorSpace: 'srgb' });

  const width = frame.codedWidth;
  const height = frame.codedHeight;

  frame.close();
  decoder.close();

  return { data, width, height };
}
