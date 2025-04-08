import type { DecoderFactory } from '../types';
import { PngDecoder } from '../implementations/png';

export const PngFactory: DecoderFactory = {
  name: 'pngjs',
  formats: ['png'],
  priority: 1,
  dependencies: ['pngjs'],
  async create() {
    return new PngDecoder();
  }
};