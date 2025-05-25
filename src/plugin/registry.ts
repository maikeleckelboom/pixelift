import type { CommonDecoderOptions, PixeliftInput, PixeliftOptions } from '@/types';
import type { PixelDecoder } from '@/plugin/types';
import { validateDecoderConfig } from '@/plugin/validate';

// Internal registry
const decoders: PixelDecoder<any, any, any>[] = [];

/** Register a decoder if not already present by name. */
export function registerDecoder<
  TRaw = any,
  TPrep = any,
  TOpt extends object = PixeliftOptions
>(decoder: PixelDecoder<TRaw, TPrep, TOpt>): void {
  if (!decoders.find((d) => d.name === decoder.name)) {
    decoders.push(decoder as PixelDecoder<any, any, any>);
  }
}

/** Return shallow clone of registered decoders (loose type) */
export function getDecoders(): PixelDecoder<PixeliftInput, any, any>[] {
  return [...decoders];
}

/** Sort decoders by descending priority */
function sortByPriority<T extends PixelDecoder>(list: T[]): T[] {
  return [...list].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

/** Helper: cast from type-erased decoder to typed form */
export function asDecoder<TRaw, TPrep, TOpt extends object>(
  decoder: PixelDecoder<any, any, any>
): PixelDecoder<TRaw, TPrep, TOpt> {
  return decoder as PixelDecoder<TRaw, TPrep, TOpt>;
}

/** Validate and define a typed decoder */
export function defineDecoder<
  TIn extends PixeliftInput = any,
  THandled extends TIn = TIn,
  TMid extends THandled = THandled,
  TOpt extends PixeliftOptions = PixeliftOptions
>(decoder: PixelDecoder<TIn, TMid, TOpt>): PixelDecoder<TIn, TMid, TOpt> {
  if (process.env.NODE_ENV !== 'production') {
    try {
      validateDecoderConfig(decoder);
    } catch (err) {
      throw new TypeError(
        `Invalid decoder "${decoder.name}": ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  registerDecoder(decoder);
  return decoder;
}

async function tryResolveSpecificDecoder<TRaw, TPrep, TOpt extends object>(
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

async function autoResolveDecoder<TRaw, TPrep, TOpt extends object>(
  input: TRaw,
  options?: TOpt
): Promise<PixelDecoder<TRaw, TPrep, TOpt> | null> {
  for (const decoder of sortByPriority(decoders)) {
    try {
      if (await decoder.canHandle(input, options)) {
        return asDecoder<TRaw, TPrep, TOpt>(decoder);
      }
    } catch (err) {
      console.warn(`Decoder "${decoder.name}" failed in canHandle():`, err);
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
    throw new Error(`No suitable decoder found for input type: ${typeof input}`);
  }

  return resolved;
}
