import type { BrowserOptions } from '../../types';

export function imageDecoderOptions(
  source: ImageBufferSource,
  sourceType?: string,
  options?: BrowserOptions
): ImageDecoderInit {
  return {
    data: source,
    type: options?.type ?? sourceType ?? 'image/png',
    colorSpaceConversion: 'none'
  };
}

export function imageDecodeOptions(options?: BrowserOptions): ImageDecodeOptions {
  return {
    frameIndex: options?.frameIndex ?? 0,
    completeFramesOnly: !!options?.completeFramesOnly
  };
}
