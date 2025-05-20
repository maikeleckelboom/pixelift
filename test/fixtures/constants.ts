export const PIXELIFT_BROWSER_DECODERS = ['webCodecs', 'offscreenCanvas'] as const;
export const PIXELIFT_SERVER_DECODERS = ['sharp'] as const;
export const LOSSLESS_TEST_FORMATS = ['png', 'svg', 'gif'] as const;
export const LOSSY_TEST_FORMATS = ['webp', 'avif'] as const;

export function listTestFormats() {
  return [...LOSSLESS_TEST_FORMATS, ...LOSSY_TEST_FORMATS] as const;
}

export type LosslessTestFormat = (typeof LOSSLESS_TEST_FORMATS)[number];

export const SNAPSHOT_FIXTURE_FILENAME = 'pixelift-consistent-hash-test.ts';

/**
 * Generate a unique snapshot key for consistency testing.
 * @param format – one of LOSSLESS_TEST_FORMATS, e.g. "png"
 * @param caseIndex – the 1-based test case index
 */
export function makeSnapshotKey(format: string, caseIndex: number): string {
  return `${format} | case ${caseIndex}`;
}
