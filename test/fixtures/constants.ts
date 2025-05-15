export const PIXELIFT_BROWSER_DECODERS = ['webCodecs', 'offscreenCanvas'] as const;

export const PIXELIFT_SERVER_DECODERS = ['sharp'] as const;

export const LOSSLESS_TEST_FORMATS = ['png', 'svg', 'gif'] as const;

export type LosslessTestFormat = (typeof LOSSLESS_TEST_FORMATS)[number];

export const losslessImageFormats = [
  ['png', 'image/png'],
  ['svg', 'image/svg+xml'],
  ['bmp', 'image/bmp'],
  ['tiff', 'image/tiff'],
  ['tif', 'image/tiff'],
  ['ico', 'image/x-icon'],
  ['apng', 'image/apng'],
  ['qoi', 'image/qoi'],
  ['exr', 'image/exr']
] as const;
