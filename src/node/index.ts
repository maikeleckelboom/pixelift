import type { NodeInput, NodeOptions, PixelData } from '../types.ts';
import { getBuffer } from './utils/buffer.ts';
import { detect } from './utils/detect.ts';
import { DecoderRegistry } from './decoders/registry.ts';

export async function pixelift(input: NodeInput, options: NodeOptions = {}): Promise<PixelData> {
  const buffer = await getBuffer(input);
  const format = detect(buffer);
  const decoder = await DecoderRegistry.getDecoderByFormat(format);
  return decoder.decode(buffer, options.options as Record<string, unknown>);
}
