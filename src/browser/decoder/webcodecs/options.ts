import type { BrowserOptions } from '../../types';

export function imageDecoderOptions(options?: BrowserOptions): ImageDecodeOptions {
  return {
    frameIndex: options?.frameIndex ?? 0,
    completeFramesOnly: !!options?.completeFramesOnly
  };
}

export function imageDecoderInitOptions(
  source: ImageBufferSource,
  sourceType: string,
  options?: BrowserOptions
): ImageDecoderInit {
  return {
    data: source,
    type: options?.type ?? sourceType,
    desiredHeight: options?.height,
    desiredWidth: options?.width,
    colorSpaceConversion: 'none'
  };
}
