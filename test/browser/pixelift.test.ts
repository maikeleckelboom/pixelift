import { beforeAll, expect, test } from 'vitest';
import { pixelift } from '../../src';
import { hashSHA256 } from '../fixtures/utils/hash-sha256';
import {
  listTestFormats,
  LOSSLESS_TEST_FORMATS,
  makeSnapshotKey
} from '../fixtures/constants';
import { getFixtureAssetUrl } from '../fixtures/utils/browser-asset-helpers';

const testAssetUrls: Partial<Record<string, URL>> = {};

beforeAll(async () => {
  for (const format of listTestFormats()) {
    testAssetUrls[format] = getFixtureAssetUrl(format, window.location.origin);
  }
});

const browserFormatCases = LOSSLESS_TEST_FORMATS.map((fmt, idx) => [fmt, idx + 1] as const);

test.each(browserFormatCases)(
  '[browser] %s | case %d',
  async (format, caseIndex) => {
    const imageUrl = testAssetUrls[format] as URL;
    const result = await pixelift(imageUrl);
    expect(result).toBeDefined();

    const hash = await hashSHA256(result.data);
    expect(hash).toMatchSnapshot(makeSnapshotKey(format, caseIndex));
  },
  0
);
