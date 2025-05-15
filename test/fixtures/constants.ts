export const PIXELIFT_BROWSER_DECODERS = ['webCodecs', 'offscreenCanvas'] as const;

export const PIXELIFT_SERVER_DECODERS = ['sharp'] as const;

export const LOSSLESS_TEST_FORMATS = ['png', 'svg', 'gif'] as const;

const LOSSY_TEST_FORMATS = ['webp', 'avif'] as const;

export const ALL_TEST_FORMATS = [...LOSSLESS_TEST_FORMATS, ...LOSSY_TEST_FORMATS] as const;

export type LosslessTestFormat = (typeof LOSSLESS_TEST_FORMATS)[number];
