import type { PixeliftInput, PixeliftOptions } from '@/types';
import type { PixelDecoder } from '@/plugin/types';
import { validateDecoderConfig } from '@/plugin/validate';

const decoders: PixelDecoder<
  PixeliftInput,
  any,
  any,
  PixeliftOptions,
  PixeliftOptions,
  PixeliftOptions
>[] = [];

export function registerDecoder<
  TIn extends PixeliftInput = PixeliftInput,
  THandled extends TIn = TIn,
  TMid = THandled
>(decoder: PixelDecoder<TIn, THandled, TMid>): void {
  if (!decoders.find((d) => d.name === decoder.name)) {
    decoders.push(decoder as PixelDecoder<PixeliftInput, any, any>);
  }
}

export function getDecoders(): PixelDecoder<PixeliftInput, any, any>[] {
  return [...decoders];
}

function sortByPriority(
  decoders: PixelDecoder<PixeliftInput, any, any>[]
): PixelDecoder<PixeliftInput, any, any>[] {
  return decoders.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

export function defineDecoder<
  TIn extends PixeliftInput,
  THandled extends TIn = TIn,
  TMid = THandled,
  TOptions extends PixeliftOptions = PixeliftOptions
>(
  decoder: PixelDecoder<TIn, THandled, TMid, TOptions>
): PixelDecoder<TIn, THandled, TMid, TOptions> {
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

  registerDecoder(decoder as PixelDecoder<TIn, THandled, TMid, TOptions>);
  return decoder as PixelDecoder<TIn, THandled, TMid, TOptions>;
}

export async function resolveDecoder<TIn extends PixeliftInput = PixeliftInput>(
  input: TIn,
  options?: { decoder?: string; [key: string]: any }
): Promise<PixelDecoder<TIn, any, any>> {
  if (options?.decoder) {
    const specificDecoder = decoders.find((d) => d.name === options.decoder);
    if (specificDecoder) {
      if (specificDecoder?.isHandledInput?.(input)) {
        return specificDecoder;
      }
      if (await specificDecoder?.canHandle(input)) {
        return specificDecoder;
      }
    }
    console.warn(
      `Requested decoder "${options.decoder}" cannot handle the input or was not found. Attempting auto-resolution.`
    );
  }

  for (const decoder of sortByPriority(decoders)) {
    try {
      if ('isHandledInput' in decoder && decoder.isHandledInput?.(input)) {
        return decoder;
      }
      const canHandleResult = await Promise.resolve(decoder.canHandle(input));
      if (canHandleResult) {
        return decoder;
      }
    } catch (error) {
      console.warn(`Error checking if decoder ${decoder.name} can handle input:`, error);
    }
  }

  throw new Error(`No suitable decoder found for input type: ${typeof input}`);
}
