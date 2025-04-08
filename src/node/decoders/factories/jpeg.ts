import type { DecoderFactory } from '../types.ts';
import { JpegDecoder } from '../implementations/jpeg.ts';

export const JpegFactory: DecoderFactory = {
  name: 'jpeg-js',
  formats: ['jpg', 'jpeg'],
  dependencies: ['jpeg-js'],
  priority: 1,
  async create() {
    // Here we should check for dependencies
    return new JpegDecoder();
  },
};