import type { BrowserOptions, WebCodecsDecoderOptions } from '../../types';

export function imageDecoderOptions(
  source: ImageBufferSource,
  type?: string,
  options?: BrowserOptions
): ImageDecoderInit {
  return {
    data: source,
    type: type || options?.type || 'image/png',
    colorSpaceConversion: 'none'
  };
}

export function imageDecodeOptions(options?: WebCodecsDecoderOptions): ImageDecodeOptions {
  return {
    frameIndex: options?.options?.frameIndex ?? 0,
    completeFramesOnly: options?.options?.completeFramesOnly ?? false
  };
}
