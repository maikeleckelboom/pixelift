import type { DecoderFactory } from '../types.ts';
import { GifDecoder } from '../implementations/gif.ts';

export const GifFactory: DecoderFactory = {
  name: 'omggif',
  formats: ['gif'],
  dependencies: ['omggif'],
  priority: 1,
  async create() {
    // Here we should check for dependencies
    return new GifDecoder();
  },
};