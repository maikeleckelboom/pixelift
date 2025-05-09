import { beforeAll, describe, expect, test } from 'vitest';
import { pixelift } from '../../src';
import { VERIFIED_INPUT_FORMATS, type VerifiedFormat } from '../../src/shared/constants';

const blobs: Partial<Record<VerifiedFormat, Blob>> = {};
const urls: Partial<Record<VerifiedFormat, URL>> = {};

beforeAll(async () => {
  for (const format of VERIFIED_INPUT_FORMATS) {
    const resourceUrl = new URL(`../fixtures/pixelift.${format}`, import.meta.url);
    urls[format] = resourceUrl;
    blobs[format] = await (await fetch(resourceUrl)).blob();
  }
});

describe('Pixelift Browser', () => {
  test.each(VERIFIED_INPUT_FORMATS)(
    'should decode a %s image from `Blob`',
    async (format) => {
      const result = await pixelift(blobs[format] as Blob);
      expect(result.data).toBeInstanceOf(Uint8ClampedArray);
      expect(result.width).toBeDefined();
      expect(result.height).toBeDefined();
    },
    0
  );

  test.each(VERIFIED_INPUT_FORMATS)(
    'should decode a %s image from `URL`',
    async (format) => {
      const result = await pixelift(urls[format] as URL);
      expect(result.data.toString()).toMatchSnapshot();
    },
    0
  );
}, 0);
