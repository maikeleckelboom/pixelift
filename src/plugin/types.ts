import type { CommonDecoderOptions, PixelData, PixeliftInput } from '../types';
import type { PixeliftEnv } from '@/shared/env.ts';

export interface PixelDecoderMetadata {
  /**
   * Specifies the runtime environments where this decoder is intended to operate.
   * Crucial for the registry to select environment-appropriate decoders.
   */
  supportedEnvs: PixeliftEnv[];

  /**
   * An array of MIME types that this decoder can confidently handle.
   * This is a primary hint for the registry when the input has a known MIME type.
   * Optional, as some decoders might not rely on MIME types.
   */
  supportedMimes?: string[];
  /**
   * Semantic version of the decoder implementation (e.g., "1.0.2").
   */
  version?: string;

  /**
   * A brief description of the decoder.
   */
  description?: string;
}

/**
 * Represents a generic decoder interface for processing pixel-based data.
 *
 * @template TRawInput The type of the raw input data this decoder processes. Defaults to PixeliftInput.
 * @template TPreparedInput The type of the prepared input data after preparation. Defaults to TRawInput.
 * @template TOptions The type of options that can be passed to the decoder. Extends an object and defaults to CommonDecoderOptions.
 */
export interface PixelDecoder<
  TRawInput = PixeliftInput,
  TPreparedInput = TRawInput,
  TOptions extends object = CommonDecoderOptions
> {
  name: string;
  metadata: PixelDecoderMetadata;
  priority?: number;

  canHandle(input: unknown, options?: TOptions): Promise<boolean>;

  prepareForDecode?(input: TRawInput, options?: TOptions): Promise<TPreparedInput>;

  decode(input: TPreparedInput, options?: TOptions): Promise<PixelData>;

  dispose?(): Promise<void> | void;
}
