import type { PixelData } from '../types';
import type { ServerInput, ServerOptions } from './types';

/**
 * Server-side entry point for the Pixelift library.
 *
 * @param {ServerInput} input - The input data to be processed by the Pixelift decoder.
 * @param {ServerOptions?} [options] - Optional configuration settings for the decoding process.
 * @return {Promise<PixelData>} A promise that resolves to the processed pixel data.
 */
export async function pixelift(
    input: ServerInput,
    options?: ServerOptions
): Promise<PixelData> {
    const decoder = await import('./decoder');
    return await decoder.decode(input, options);
}

export type { ServerInput, ServerOptions } from './types';
