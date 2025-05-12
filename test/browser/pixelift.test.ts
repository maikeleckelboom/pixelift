import { beforeAll, describe, expect, test } from 'vitest';
import { pixelift } from '../../src';
import { VERIFIED_INPUT_FORMATS, type VerifiedFormat } from '../../src/shared/constants';
import { hashSHA256 } from '../fixtures/hash-sha256';

const blobs: Partial<Record<VerifiedFormat, Blob>> = {};
const urls: Partial<Record<VerifiedFormat, URL>> = {};

beforeAll(async () => {
  for (const format of VERIFIED_INPUT_FORMATS) {
    const resourceUrl = new URL(`../fixtures/assets/pixelift.${format}`, import.meta.url);
    urls[format] = resourceUrl;
    const response = await fetch(resourceUrl);
    blobs[format] = await response.blob();
  }
}, 0);

describe('Decoding from URL', () => {
  test.each(VERIFIED_INPUT_FORMATS)(
    '%s → decodes successfully from URL',
    async (format) => {
      const result = await pixelift(urls[format] as URL);
      expect(result.width).toBeDefined();
      expect(result.height).toBeDefined();
      expect(result.data).toBeInstanceOf(Uint8ClampedArray);
    },
    0
  );
});

// todo: differentiate between lossy and non-lossy formats so we can
test.each(VERIFIED_INPUT_FORMATS)(
  '%s: consistent hash from URL across runs and environments',
  async (format) => {
    const result = await pixelift(urls[format] as URL, { decoder: 'offscreenCanvas' });
    const hash = await hashSHA256(result.data);
    expect(hash).toMatchSnapshot();
  },
  0
);
