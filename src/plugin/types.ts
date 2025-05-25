import type { PixelData, PixeliftInput, PixeliftOptions } from '../types';

export type PixeliftEnvPlatform = 'node' | 'browser' | 'edge' | 'worker';

export interface PixelDecoderMetadata {
  version?: string;
  runtimes?: PixeliftEnvPlatform[];
  supportedMimeTypes?: string[];
  description?: string;
  capabilities?: string[];
}

export interface PixelDecoder<
  TRawInput = PixeliftInput,
  TPreparedInput = TRawInput,
  TOptions extends object = PixeliftOptions
> {
  name: string;
  priority?: number;
  metadata?: PixelDecoderMetadata;

  canHandle(input: unknown, options?: TOptions): Promise<boolean>;

  prepareForDecode?(input: TRawInput, options?: TOptions): Promise<TPreparedInput>;

  decode(input: TPreparedInput, options?: TOptions): Promise<PixelData>;
}
