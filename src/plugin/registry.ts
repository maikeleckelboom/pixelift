import type { CommonDecoderOptions, PixeliftOptions } from '@/types';
import type { PixelDecoder } from '@/plugin/types';
import { validateDecoderConfig } from '@/plugin/validate';

const decoders: PixelDecoder<any, any, any>[] = [];

/**
 * Register a decoder if not already present by name.
 * Enforces uniqueness and keeps decoder list sorted by priority descending.
 */
export function registerDecoder<
  InputType = any,
  ProcessedType = any,
  DecoderOptions extends object = PixeliftOptions
>(decoder: PixelDecoder<InputType, ProcessedType, DecoderOptions>): void {
  if (!decoders.some((d) => d.name === decoder.name)) {
    decoders.push(decoder as PixelDecoder<any, any, any>);
    decoders.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }
}

/**
 * Get a shallow clone of all registered decoders,
 * sorted by descending priority (highest priority first).
 */
export function getDecoders(): PixelDecoder<any, any, any>[] {
  return [...decoders];
}

/**
 * Helper: cast a generic decoder to a strongly typed decoder.
 * Use carefully; ensure type compatibility via canHandle checks before using.
 */
export function asDecoder<InputType, ProcessedType, DecoderOptions>(
  decoder: PixelDecoder<any, any, any>
): PixelDecoder<InputType, ProcessedType, DecoderOptions> {
  return decoder as PixelDecoder<InputType, ProcessedType, DecoderOptions>;
}

/**
 * Validate and define a typed decoder.
 * Registers the decoder and returns it.
 * @template InputType - The raw input type the decoder can receive
 * @template HandledInputType - Specific input subtype this decoder handles
 * @template ProcessedType - Result type after processing (extends HandledInputType)
 * @template DecoderOptions - Configuration options for this decoder
 */
export function defineDecoder<
  InputType = any,
  HandledInputType extends InputType = InputType,
  ProcessedType = HandledInputType,
  DecoderOptions extends PixeliftOptions = PixeliftOptions
>(
  decoder: PixelDecoder<InputType, ProcessedType, DecoderOptions>
): PixelDecoder<InputType, ProcessedType, DecoderOptions> {
  if (process.env.NODE_ENV !== 'production') {
    try {
      validateDecoderConfig(decoder);
    } catch (err) {
      throw new TypeError(
        `Invalid decoder "${decoder.name}": ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  registerDecoder(decoder);
  return decoder;
}

async function tryResolveSpecificDecoder<TRaw, TPrep, TOpt>(
  name: string,
  input: TRaw,
  options?: TOpt
): Promise<PixelDecoder<TRaw, TPrep, TOpt> | null> {
  const decoder = decoders.find((d) => d.name === name);
  if (!decoder) return null;

  try {
    if (await decoder.canHandle(input, options)) {
      return asDecoder<TRaw, TPrep, TOpt>(decoder);
    }
  } catch (err) {
    console.warn(`Decoder "${decoder.name}" canHandle() threw:`, err);
  }

  return null;
}

export async function listCompatibleDecoders<TRaw, TPrep, TOpt>(
  input: TRaw,
  options?: TOpt
): Promise<PixelDecoder<TRaw, TPrep, TOpt>[]> {
  const results: PixelDecoder<TRaw, TPrep, TOpt>[] = [];

  for (const decoder of decoders) {
    try {
      if (await decoder.canHandle(input, options)) {
        results.push(asDecoder<TRaw, TPrep, TOpt>(decoder));
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`Decoder "${decoder.name}" canHandle() error:`, err);
      }
    }
  }

  return results;
}

async function autoResolveDecoder<TRaw, TPrep, TOpt extends object>(
  input: TRaw,
  options?: TOpt
): Promise<PixelDecoder<TRaw, TPrep, TOpt> | null> {
  for (const decoder of getDecoders()) {
    try {
      if (await decoder.canHandle(input, options)) {
        return asDecoder<TRaw, TPrep, TOpt>(decoder);
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`Decoder "${decoder.name}" canHandle() error:`, err);
      }
    }
  }

  return null;
}

export async function resolveDecoder<
  TRawInput = any,
  TPreparedInput = any,
  TOptions extends CommonDecoderOptions = CommonDecoderOptions
>(
  input: TRawInput,
  options?: TOptions
): Promise<PixelDecoder<TRawInput, TPreparedInput, TOptions>> {
  if (options?.decoder) {
    const specific = await tryResolveSpecificDecoder<TRawInput, TPreparedInput, TOptions>(
      options.decoder,
      input,
      options
    );

    if (specific) return specific;

    console.warn(
      `Decoder "${options.decoder}" not found or not suitable. Falling back to auto-resolution.`
    );
  }

  const resolved = await autoResolveDecoder<TRawInput, TPreparedInput, TOptions>(
    input,
    options
  );
  if (!resolved) {
    const typeInfo =
      input === null
        ? 'null'
        : typeof input === 'object'
          ? input?.constructor?.name || 'object'
          : typeof input;
    throw new Error(`No suitable decoder found for input type: ${typeInfo}`);
  }

  return resolved;
}
