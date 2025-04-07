// src/decoders/factories/jpeg.ts
import type {DecoderFactory} from '../types.ts';
import { JpegDecoder } from '../implementations/jpeg.ts';

export const JPEGFactory: DecoderFactory = {
    name: 'jpeg-decoder',
    formats: ['jpg', 'jpeg'],
    priority: 1,
    async create() {
        // Here we should check for dependencies
        return new JpegDecoder();
    }
};