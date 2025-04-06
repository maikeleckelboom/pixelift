// src/decoders/factories/sharp.ts
import type {DecoderFactory} from "../types.ts";

export const SharpFactory: DecoderFactory = {
    name: 'sharp',
    formats: ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'avif'],
    priority: 1000, // High priority for sharp
    requires: ['sharp'],
    async create() {
        // @ts-expect-error `sharp` might not be installed
        const sharp = await import('sharp');
        return {
            async decode(buffer) {
                const {data, info} = await sharp(buffer)
                    .ensureAlpha()
                    .raw()
                    .toBuffer({resolveWithObject: true});

                return {
                    data: new Uint8Array(data.buffer),
                    width: info.width,
                    height: info.height,
                    channels: info.channels as 3 | 4
                };
            }
        };
    }
};