import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, test } from 'vitest';
import { pixelift } from '../../src/server';
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

describe('cross-platform validity', () => {
  test.each(VERIFIED_INPUT_FORMATS)(
    'should generate a unique hash for %s and save it as a snapshot`',
    async (format) => {
      const result = await pixelift(urls[format] as URL);
      const hash = await hashSHA256(result.data);
      expect(hash).toMatchSnapshot(format);
    },
    0
  );
});
