import type {CommonDecoderOptions, PixelData, PixeliftInput, PixeliftOptions} from "@/types";
import type {BrowserInput, BrowserOptions} from "./browser";
import type {ServerInput, ServerOptions} from "@/server";
import {isBrowser} from "@/shared/env.ts";

interface Decoder<I extends PixeliftInput, O extends CommonDecoderOptions> {
    decode: (input: I, options?: O) => Promise<PixelData>;
}

export interface EnvironmentConfig<I extends PixeliftInput, O extends PixeliftOptions> {
    validate: (input: unknown) => input is I;
    load: () => Promise<Decoder<I, O>>;
    /**
     * Human-readable names of input types expected by the decoder.
     * Used for error messages only, not for validation logic.
     */
    expectedInputTypes: string[];
}

export const browserConfig: EnvironmentConfig<BrowserInput, BrowserOptions> = {
    validate: (input: unknown): input is BrowserInput => {
        return false;
    },
    load: () => import('./browser/decoder'),
    expectedInputTypes: [
        'string',
        'URL',
        'Blob',
        'ReadableStream',
        'BufferSource',
        'SVGElement',
        'HTMLImageElement',
        'HTMLVideoElement'
    ]
};

export const serverConfig: EnvironmentConfig<ServerInput, ServerOptions> = {
    validate: (input: unknown): input is ServerInput => {
        return false;
    },
    load: () => import('./server/decoder'),
    expectedInputTypes: [
        'string',
        'URL',
        'Buffer',
        'BufferSource',
        'ReadableStream',
        'Readable',
    ]
};

/**
 * Decodes an image input into pixel data in browser or server environments.
 * @param input - The image source (e.g., URL, Blob, Buffer, HTML element).
 * @param options - Configuration options for decoding.
 * @returns A promise resolving to pixel data (width, height, RGBA bytes).
 * @throws {Error} If decoding fails or input is invalid.
 */
export async function pixelift(
    input: PixeliftInput,
    options?: PixeliftOptions
): Promise<PixelData> {
    const config = isBrowser() ? browserConfig : serverConfig;

    if (!config.validate(input)) {
        throw new TypeError(
            `Invalid input type. Expected one of: ${config.expectedInputTypes.join(', ')}. Received: ${typeof input}`
        );
    }

    const decoder = await config.load();

    return decoder.decode(input as never, options as never);
}
