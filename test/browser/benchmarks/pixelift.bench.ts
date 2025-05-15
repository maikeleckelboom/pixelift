import { beforeAll, bench, describe } from 'vitest';
import { pixelift } from '../../../src';
import {
  LOSSLESS_TEST_FORMATS,
  type LosslessTestFormat,
  PIXELIFT_BROWSER_DECODERS
} from '../../fixtures/constants';

let urls: Record<LosslessTestFormat, URL>;

beforeAll(() => {
  urls = Object.fromEntries(
    LOSSLESS_TEST_FORMATS.map((format) => [
      format,
      new URL(`../../fixtures/assets/pixelift.${format}`, import.meta.url)
    ])
  ) as Record<LosslessTestFormat, URL>;
});

describe('Browser Benchmarks', () => {
  for (const decoder of PIXELIFT_BROWSER_DECODERS) {
    for (const format of LOSSLESS_TEST_FORMATS) {
      bench(
        `${decoder} - ${format}`,
        async () => {
          await pixelift(urls[format]);
        },
        {
          iterations: 50,
          warmupTime: 0.5
        }
      );
    }
  }
});
