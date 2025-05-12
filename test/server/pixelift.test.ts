import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, test } from 'vitest';
import { pixelift } from '../../src';
import { VERIFIED_INPUT_FORMATS, type VerifiedFormat } from '../../src/shared/constants';
import { hashSHA256 } from '../fixtures/hash-sha256';

const buffers: Partial<Record<VerifiedFormat, Buffer>> = {};
const urls: Partial<Record<VerifiedFormat, URL>> = {};

beforeAll(() => {
  for (const format of VERIFIED_INPUT_FORMATS) {
    const resourceUrl = new URL(`../fixtures/assets/pixelift.${format}`, import.meta.url);
    urls[format] = resourceUrl;
    buffers[format] = readFileSync(resourceUrl);
  }
});

describe('Server Environment', () => {
  test.each(VERIFIED_INPUT_FORMATS)(
    'should decode %s from `Buffer`',
    async (format) => {
      const result = await pixelift(buffers[format] as Buffer);
      expect(result.width).toBeDefined();
      expect(result.height).toBeDefined();
      expect(result.data).toBeInstanceOf(Uint8ClampedArray);
    },
    0
  );

  test.each(VERIFIED_INPUT_FORMATS)(
    'should decode %s from `URL`',
    async (format) => {
      const result = await pixelift(urls[format] as URL);
      expect(result.width).toBeDefined();
      expect(result.height).toBeDefined();
      expect(result.data).toBeInstanceOf(Uint8ClampedArray);
    },
    0
  );
});

test.each(VERIFIED_INPUT_FORMATS)(
  '%s: consistent hash from URL across runs and environments',
  async (format) => {
    const result = await pixelift(urls[format] as URL, { decoder: 'sharp' });
    const hash = await hashSHA256(result.data);
    expect(hash).toMatchSnapshot();
  },
  0
);
