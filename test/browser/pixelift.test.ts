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

describe('Pixelift (Browser)', () => {
  describe('Decoding from Blob', () => {
    test.each(VERIFIED_INPUT_FORMATS)(
      '%s → decodes successfully from Blob',
      async (format) => {
        const result = await pixelift(blobs[format] as Blob);
        expect(result.data).toBeInstanceOf(Uint8ClampedArray);
        expect(result.width).toBeDefined();
        expect(result.height).toBeDefined();
      },
      0
    );
  });

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

  describe('decode-consistency', () => {
    test.each(VERIFIED_INPUT_FORMATS)(
      // decode-consistency > should decode {format} identically across environments
      'should decode %s identically across environments',
      async (format) => {
        const result = await pixelift(urls[format] as URL);
        const hash = await hashSHA256(result.data);
        expect(hash).toMatchSnapshot(`${format} via URL`);
      },
      0
    );
  });
});
