import { beforeAll, bench, describe } from 'vitest';
import { pixelift } from '../../../src';
import {
  LOSSLESS_TEST_FORMATS,
  type LosslessTestFormat,
  PIXELIFT_BROWSER_DECODERS
} from '../../fixtures/constants';
import { getFixtureAssetUrl } from '../../fixtures/utils/asset-helpers';

let testAssetUrls: Record<LosslessTestFormat, URL>;

beforeAll(() => {
  testAssetUrls = Object.fromEntries(
    LOSSLESS_TEST_FORMATS.map((format) => [
      format,
      getFixtureAssetUrl(format, window.location.href)
    ])
  ) as Record<LosslessTestFormat, URL>;
});

describe('Browser Benchmarks', () => {
  for (const decoder of PIXELIFT_BROWSER_DECODERS) {
    for (const format of LOSSLESS_TEST_FORMATS) {
      bench(
        `${decoder} - ${format}`,
        async () => {
          await pixelift(testAssetUrls[format], { decoder });
        },
        {
          iterations: 100
        }
      );
    }
  }
});
