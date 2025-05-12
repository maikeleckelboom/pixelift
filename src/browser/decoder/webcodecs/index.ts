import type { PixelData } from '../../../types';
import type { BrowserOptions } from '../../types';
import { imageDecoderInitOptions, imageDecoderOptions } from './options';

async function isTypeSupported(type: string): Promise<boolean> {
  return await ImageDecoder.isTypeSupported(type);
}

export async function isSupported(type: string): Promise<boolean> {
  return 'webcodecs' in window && (await isTypeSupported(type));
}

export async function decode(input: Blob, options?: BrowserOptions): Promise<PixelData> {
  const arrayBuffer = await input.arrayBuffer();

  const decoder = new ImageDecoder(
    imageDecoderInitOptions(arrayBuffer, input.type, options)
  );

  await decoder.completed;

  const { image: frame } = await decoder.decode(imageDecoderOptions(options));

  const byteLength = frame.allocationSize({ format: 'RGBA' });

  const data = new Uint8ClampedArray(byteLength);
  await frame.copyTo(data, { format: 'RGBA', colorSpace: 'srgb' });

  const width = frame.codedWidth;
  const height = frame.codedHeight;

  frame.close();
  decoder.close();

  return { data, width, height };
}
