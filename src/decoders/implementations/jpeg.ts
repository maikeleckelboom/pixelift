// src/decoders/implementations/jpeg.ts
import type {Decoder, PixelData} from "../types.ts";

export class JpegDecoder implements Decoder {
    async decode(buffer: Buffer): Promise<PixelData> {
        // @ts-ignore `jpeg-js` might not be installed
        const jpeg = await import('jpeg-js');
        return jpeg.decode(buffer);
    }
}