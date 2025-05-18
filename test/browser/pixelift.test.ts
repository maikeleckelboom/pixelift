import { beforeAll, expect, test } from 'vitest';
import { pixelift } from '../../src';
import { hashSHA256 } from '../fixtures/hash-sha256';
import { ALL_TEST_FORMATS, LOSSLESS_TEST_FORMATS } from '../fixtures/constants';
import { snapshotTestCaseKey } from '../fixtures/snapshot-test-case-key';

const blobs: Partial<Record<string, Blob>> = {};
const urls: Partial<Record<string, URL>> = {};

beforeAll(async () => {
  for (const format of ALL_TEST_FORMATS) {
    const resourceUrl = new URL(`../fixtures/assets/pixelift.${format}`, import.meta.url);
    urls[format] = resourceUrl;
    const response = await fetch(resourceUrl);
    blobs[format] = await response.blob();
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
  20_000
);
