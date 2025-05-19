import { beforeAll, expect, test } from 'vitest';
import { pixelift } from '../../src';
import { hashSHA256 } from '../fixtures/utils/hash-sha256';
import {
  ALL_TEST_FORMATS,
  LOSSLESS_TEST_FORMATS,
  snapshotTestCaseKey
} from '../fixtures/constants';
import { getFixtureAssetUrl } from '../fixtures/utils/asset-helpers';

const testAssetUrls: Partial<Record<string, URL>> = {};

beforeAll(async () => {
  for (const format of ALL_TEST_FORMATS) {
    testAssetUrls[format] = getFixtureAssetUrl(format, import.meta.url);
  }
});

test.each(LOSSLESS_TEST_FORMATS)(
  `%s: ${snapshotTestCaseKey()}`,
  async (format) => {
    const imageUrl = testAssetUrls[format];
    if (!imageUrl) throw new Error(`URL for format ${format} not loaded`);

    const result = await pixelift(imageUrl);
    expect(result).toBeDefined();

    const hash = await hashSHA256(result.data);
    expect(hash).toMatchSnapshot();
  },
  30_000
);
