export const PIXELIFT_BROWSER_DECODERS = ['webCodecs', 'offscreenCanvas'] as const;

export const PIXELIFT_SERVER_DECODERS = ['sharp'] as const;

export const PIXELIFT_DECODERS = [
  ...PIXELIFT_BROWSER_DECODERS,
  ...PIXELIFT_SERVER_DECODERS
] as const;

export type PixeliftDecoder = (typeof PIXELIFT_DECODERS)[number];

export const VERIFIED_INPUT_FORMATS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'svg',
  'avif'
] as const;

export type VerifiedFormat = (typeof VERIFIED_INPUT_FORMATS)[number];
