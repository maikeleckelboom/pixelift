import type { PixelData } from '../../../types';
import type { BrowserOptions } from '../../types';
import { createError } from '../../../shared/error';
import { imageDecoderOptions } from './options';

export async function isSupported(type: string): Promise<boolean> {
  return (
    'ImageDecoder' in window &&
    typeof ImageDecoder.isTypeSupported === 'function' &&
    (await ImageDecoder.isTypeSupported(type))
  );
}

export async function decode(input: Blob, _options?: BrowserOptions): Promise<PixelData> {
  if (!(input instanceof Blob)) {
    throw createError.invalidInput('Blob', typeof input);
  }

  const buffer = await input.arrayBuffer();
  const decoder = new ImageDecoder(imageDecoderOptions(buffer, input));

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
