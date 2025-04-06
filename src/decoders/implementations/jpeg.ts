// src/decoders/implementations/jpeg.ts
import type {Decoder, PixelData} from "../types.ts";

export class JpegDecoder implements Decoder {
    async decode(buffer: Uint8Array): Promise<PixelData> {
        // Check if jpeg-js is available
        // @ts-ignore
        const jpeg = await import('jpeg-js');
        return jpeg.decode(buffer);
    }
}