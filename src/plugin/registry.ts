import type { CommonDecoderOptions, PixeliftInput, PixeliftOptions } from '@/types';
import type { PixelDecoder } from '@/plugin/types';
import { validateDecoderConfig } from '@/plugin/validate';

// Internal decoder registry — type-erased to any
const decoders: PixelDecoder<any, any, any>[] = [];

/**
 * Register a new decoder if it doesn't exist by name yet.
 * Generic params keep inference for the user, but are erased internally.
 */
export function registerDecoder<
  TRawInput = any,
  TPreparedInput = any,
  TOptions extends object = PixeliftOptions
>(decoder: PixelDecoder<TRawInput, TPreparedInput, TOptions>): void {
  if (!decoders.find((d) => d.name === decoder.name)) {
    decoders.push(decoder as PixelDecoder<any, any, any>);
  }
}

/** Return a shallow copy of all registered decoders, typed loosely */
export function getDecoders(): PixelDecoder<PixeliftInput, any, any>[] {
  return [...decoders];
}

/** Sort decoders by descending priority without mutating original array */
function sortByPriority<T extends PixelDecoder>(list: T[]): T[] {
  return [...list].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

/**
 * Define and register a new decoder with optional validation.
 * Keeps full typing and returns the decoder with inferred generics.
 */
export function defineDecoder<
  TIn extends PixeliftInput = any,
  THandled extends TIn = TIn,
  TMid extends THandled = THandled,
  TOptions extends PixeliftOptions = PixeliftOptions
>(
  decoder: PixelDecoder<TIn, TMid, TOptions> & {
    prepareForDecode?: (input: TIn, options?: TOptions) => Promise<TMid>;
  }
): PixelDecoder<TIn, TMid, TOptions> {
  if (process.env.NODE_ENV !== 'production') {
    try {
      validateDecoderConfig(decoder);
    } catch (err) {
      throw new TypeError(
        `Invalid decoder configuration for "${decoder.name}": ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  registerDecoder(decoder);
  return decoder;
}

/**
 * Cast a decoder from erased type to typed generic.
 * Use when you are sure of the underlying types.
 */
export function asDecoder<TRawInput, TPreparedInput, TOptions extends object>(
  decoder: PixelDecoder<any, any, any>
): PixelDecoder<TRawInput, TPreparedInput, TOptions> {
  return decoder as PixelDecoder<TRawInput, TPreparedInput, TOptions>;
}

/**
 * Resolve a decoder for given input and options.
 * Tries specific decoder if requested, else auto-resolves by priority.
 */
export async function resolveDecoder<
  TRawInput = any,
  TPreparedInput = any,
  TOptions extends CommonDecoderOptions = CommonDecoderOptions
>(
  input: TRawInput,
  options?: TOptions
): Promise<PixelDecoder<TRawInput, TPreparedInput, TOptions>> {
  // Try specific decoder by name first
  if (options?.decoder) {
    const specificDecoder = decoders.find((d) => d.name === options.decoder);
    if (specificDecoder) {
      try {
        if (await specificDecoder.canHandle(input, options)) {
          return asDecoder<TRawInput, TPreparedInput, TOptions>(specificDecoder);
        }
      } catch (e) {
        console.warn(`Error in canHandle of decoder "${specificDecoder.name}":`, e);
      }
    }
    console.warn(
      `Requested decoder "${options.decoder}" cannot handle the input or was not found. Attempting auto-resolution.`
    );
  }

  // Auto-resolve by priority
  for (const decoder of sortByPriority(decoders)) {
    try {
      if (await decoder.canHandle(input, options)) {
        return asDecoder<TRawInput, TPreparedInput, TOptions>(decoder);
      }
    } catch (error) {
      console.warn(`Error checking if decoder ${decoder.name} can handle input:`, error);
    }
  }

  throw new Error(`No suitable decoder found for input type: ${typeof input}`);
}
