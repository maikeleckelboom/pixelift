import type {
  CommonDecoderOptions,
  PixelData,
  PixeliftInput,
  PixeliftOptions
} from '../types';

export type PixeliftEnvPlatform = 'node' | 'browser' | 'edge';
export type PixeliftEnvContext = 'main' | 'worker';

export interface PixelDecoderMetadata {
  version?: string;
  platforms?: PixeliftEnvPlatform[];
  contexts?: PixeliftEnvContext[];
  formats?: string[];
  description?: string;
  capabilities?: string[];
}

export interface PixelDecoder<
  TAcceptsInput = PixeliftInput,
  THandledInput extends TAcceptsInput = TAcceptsInput,
  TDecodesWith = THandledInput,
  TOptions = PixeliftOptions,
  TCommonOptions = TOptions extends undefined ? CommonDecoderOptions : TOptions,
  TDecodeOptions = TOptions extends undefined ? PixeliftOptions : TOptions
> {
  name: string;
  priority?: number;
  metadata?: PixelDecoderMetadata;

  canHandle(input: TAcceptsInput, options?: TCommonOptions): Promise<boolean>;

  isHandledInput?(input: TAcceptsInput): input is THandledInput;

  prepareForDecode?(input: THandledInput, options?: TDecodeOptions): Promise<TDecodesWith>;

  decode(input: TDecodesWith, options?: TDecodeOptions): Promise<PixelData>;
}
