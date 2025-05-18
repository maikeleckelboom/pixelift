// src/server/decoder/index.ts

import { createError } from '../../shared/error';
import type * as SharpNS from 'sharp';
import type { ServerInput, ServerOptions } from '../../server';
import type { PixelData } from '../../types';
import { getBuffer } from '../../server/buffer';
import { getSharp } from '../../server/decoder/sharp'; // For Sharp type

/**
 * Internal helper to create and configure a Sharp pipeline tailored for PixelData output.
 *
 * @param sharpInstance - The base sharp module.
 * @param buffer - The input image buffer.
 * @param _options - ServerOptions, potentially for future Sharp configurations.
 * @returns A configured Sharp pipeline instance.
 */
function _createSharpPipelineForPixelData(
  sharpInstance: typeof SharpNS.default, // The sharp constructor/function
  buffer: Buffer,
  _options?: ServerOptions // Currently unused for pipeline modification, but good for future
): SharpNS.Sharp {
  // Basic pipeline for standardized PixelData: sRGB, ensure alpha
  // More complex configurations based on 'options' could be added here if needed.
  // For example, if options included target dimensions for an initial resize:
  // if (options?.width && options?.height) {
  //   pipeline = pipeline.resize(options.width, options.height);
  // }
  return sharpInstance(buffer)
    .toColorspace('srgb') // Standardize to sRGB for PixelData
    .ensureAlpha(); // Ensure an alpha channel for RGBA consistency
}

/**
 * Decodes a server-based image input into PixelData using the Sharp library.
 *
 * @param input - The image input (file path, URL, Buffer).
 * @param options - Optional configuration for the decoding process.
 * @returns A Promise resolving to the image's PixelData.
 * @throws {PixeliftError} If decoding fails.
 */
export async function decode(
  input: ServerInput,
  options?: ServerOptions
): Promise<PixelData> {
  // 1. Get the input as a Buffer
  const buffer = await getBuffer(input, options); // Pass options for signal etc.

  // 2. Handle AbortSignal if present
  if (options?.signal?.aborted) {
    throw createError.aborted();
  }

  // 3. Dynamically load the Sharp module
  const sharpModule = await getSharp();
  const sharpInstance = sharpModule.default; // The main sharp function

  if (typeof sharpInstance !== 'function') {
    // This error should ideally be caught by getSharp(), but as a safeguard:
    throw createError.dependencyMissing('sharp', 'Sharp function not available.');
  }

  try {
    // 4. Create the Sharp pipeline using the internal helper
    const pipeline = _createSharpPipelineForPixelData(sharpInstance, buffer, options);

    // 5. Process the image to raw pixel buffer and info
    const { data, info } = await pipeline
      .raw({ depth: 'uchar' }) // Get raw pixel data (unsigned 8-bit char)
      .toBuffer({ resolveWithObject: true }); // Resolve with data and info

    // 6. Create and return PixelData
    const targetColorSpace: PredefinedColorSpace = 'srgb'; // As per pipeline configuration
    return {
      data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
      width: info.width,
      height: info.height,
      colorSpace: targetColorSpace
    };
  } catch (error) {
    // Rethrow ensures it's a PixeliftError
    throw createError.rethrow(error, 'Sharp image processing failed.');
  }
}
