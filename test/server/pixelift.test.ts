import { readFileSync } from 'node:fs';
import { beforeAll, expect, test } from 'vitest';
import { pixelift } from '../../src';
import {
  LOSSLESS_TEST_FORMATS,
  type LosslessTestFormat,
  snapshotTestCaseKey
} from '../fixtures/constants';
import { hashSHA256 } from '../fixtures/utils/hash-sha256';

const buffers: Partial<Record<LosslessTestFormat, Buffer>> = {};
const urls: Partial<Record<LosslessTestFormat, URL>> = {};

beforeAll(() => {
  for (const format of LOSSLESS_TEST_FORMATS) {
    const resourceUrl = new URL(`../fixtures/assets/pixelift.${format}`, import.meta.url);
    urls[format] = resourceUrl;
    buffers[format] = readFileSync(resourceUrl);
  }
});

test.each(LOSSLESS_TEST_FORMATS)(
  `%s: ${snapshotTestCaseKey()}`,
  async (format) => {
    const result = await pixelift(urls[format] as URL);
    const hash = await hashSHA256(result.data);
    expect(result.width).toBeDefined();
    expect(result.height).toBeDefined();
    expect(result.data).toBeInstanceOf(Uint8ClampedArray);
    expect(hash).toMatchSnapshot();
  },
  30_000
);
