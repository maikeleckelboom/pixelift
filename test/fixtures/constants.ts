export const PIXELIFT_BROWSER_DECODERS = ['webCodecs', 'offscreenCanvas'] as const;
export const PIXELIFT_SERVER_DECODERS = ['sharp'] as const;
export const LOSSLESS_TEST_FORMATS = ['png', 'svg', 'gif'] as const;
export const LOSSY_TEST_FORMATS = ['webp', 'avif'] as const;

export function listTestFormats() {
  return [...LOSSLESS_TEST_FORMATS, ...LOSSY_TEST_FORMATS] as const;
}

export type LosslessTestFormat = (typeof LOSSLESS_TEST_FORMATS)[number];

// Constants for snapshots
export const SNAPSHOT_FIXTURE_FILENAME = 'pixelift-hash.server.test.ts';
export const BROWSER_SNAPSHOT_FILE = 'pixelift.test.ts.snap';
export const SERVER_SNAPSHOT_FILE = 'pixelift.test.ts.snap';
export const BROWSER_TEST_PREFIX = '[browser]';
export const SERVER_TEST_PREFIX = '[server]';

/**
 * Generate a base snapshot key for consistency testing.
 * @param format – one of LOSSLESS_TEST_FORMATS, e.g. "png"
 * @param caseIndex – the 1-based test case index
 */
export function makeSnapshotKey(format: string, caseIndex: number): string {
  return `${format} | case ${caseIndex}`;
}
