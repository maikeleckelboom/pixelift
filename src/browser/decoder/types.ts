import type {
  DecoderOptions,
  PixelData,
  PixeliftInput,
  PixeliftOptions
} from '../../types';

export interface Decoder<Input extends PixeliftInput, Options extends DecoderOptions> {
  decode: (input: Input, options?: Options) => Promise<PixelData>;
}

export interface DecoderStrategy<
  Input extends Blob | (ImageBitmap | Blob),
  Options extends PixeliftOptions
> extends Decoder<Input, Options> {
  id: string;
  isSupported: (type: string) => Promise<boolean>;
}
