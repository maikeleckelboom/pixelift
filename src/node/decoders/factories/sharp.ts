// src/decoders/factories/sharp.ts
import type {DecoderFactory} from "../types.ts";
import {SharpDecoder} from "../implementations/sharp.ts";

export const SharpFactory: DecoderFactory = {
    name: 'sharp',
    formats: ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'avif'],
    priority: 1000,
    dependencies: ['sharp'],
    async create() {
        return new SharpDecoder()
    }
};