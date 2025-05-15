// tests/pixelift.test.ts

import { beforeAll, describe, expect, test } from 'vitest';
import { pixelift } from '../../src';
import { hashSHA256 } from '../fixtures/hash-sha256';
import { LOSSLESS_TEST_FORMATS } from '../fixtures/constants';
import { createSnapshotTestCaseKey } from '../fixtures/create-snapshot-test-case-key';

// Initialize blobs and URLs
const blobs: Partial<Record<string, Blob>> = {};
const urls: Partial<Record<string, URL>> = {};

// Load resources before all tests
beforeAll(async () => {
  for (const format of LOSSLESS_TEST_FORMATS) {
    const resourceUrl = new URL(`../fixtures/assets/pixelift.${format}`, import.meta.url);
    urls[format] = resourceUrl;
    const response = await fetch(resourceUrl);
    blobs[format] = await response.blob();
  }
}, 0);

describe('Decoding from URL', () => {
  test.each(LOSSLESS_TEST_FORMATS)(
    `%s: ${createSnapshotTestCaseKey()}`,
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
    const result = await pixelift(urls[format] as URL);
    const hash = await hashSHA256(result.data);
    expect(hash).toMatchSnapshot();
  },
  0
);
