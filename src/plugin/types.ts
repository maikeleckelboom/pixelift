import type { PixelData, PixeliftInput, PixeliftOptions } from '../types';
import type { PixeliftEnv } from '@/shared/env.ts';

export interface PixelDecoderMetadata {
  version?: string;
  description?: string;
  supportedEnvs?: PixeliftEnv[];
  supportedMimes?: string[];
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
