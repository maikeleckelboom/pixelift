import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, test } from 'vitest';
import { pixelift } from '../../src';
import { LOSSLESS_TEST_FORMATS, type LosslessTestFormat } from '../../src/shared/constants';
import { hashSHA256 } from '../fixtures/hash-sha256';
import { createSnapshotTestCaseKey } from '../fixtures/hash-snapshot-key';

const buffers: Partial<Record<LosslessTestFormat, Buffer>> = {};
const urls: Partial<Record<LosslessTestFormat, URL>> = {};

beforeAll(() => {
  for (const format of LOSSLESS_TEST_FORMATS) {
    const resourceUrl = new URL(`../fixtures/assets/pixelift.${format}`, import.meta.url);
    urls[format] = resourceUrl;
    buffers[format] = readFileSync(resourceUrl);
  }
});

describe('Server Environment', () => {
  test.each(LOSSLESS_TEST_FORMATS)(
    'should decode %s from `Buffer`',
    async (format) => {
      const result = await pixelift(buffers[format] as Buffer);
      expect(result.width).toBeDefined();
      expect(result.height).toBeDefined();
      expect(result.data).toBeInstanceOf(Uint8ClampedArray);
    },
    0
  );

  test.each(LOSSLESS_TEST_FORMATS)(
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

test.each(LOSSLESS_TEST_FORMATS)(
  `%s: ${createSnapshotTestCaseKey()}`,
  async (format) => {
    const result = await pixelift(urls[format] as URL, { decoder: 'sharp' });
    const hash = await hashSHA256(result.data);
    expect(hash).toMatchSnapshot();
  },
  0
);
