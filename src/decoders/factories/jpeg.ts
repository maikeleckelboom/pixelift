// src/decoders/factories/jpeg.ts
import type {DecoderFactory} from '../types';
import { JpegDecoder } from '../implementations/jpeg';

export const JPEGFactory: DecoderFactory = {
    name: 'jpeg-decoder',
    formats: ['jpg', 'jpeg'],
    priority: 1,
    async create() {
        // Here you could check for dependencies
        return new JpegDecoder();
    }
};