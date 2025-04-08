import type { DecoderFactory } from '../types.ts';
import { SharpDecoder } from '../implementations/sharp.ts';

export const SharpFactory: DecoderFactory = {
  name: 'sharp',
  formats: ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'avif', 'gif'],
  dependencies: ['sharp'],
  priority: 1000,
  async create() {
    return new SharpDecoder();
  },
};