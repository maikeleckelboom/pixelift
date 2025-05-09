import { beforeAll, bench, describe } from 'vitest';
import { pixelift } from '../../../src';
import {
  PIXELIFT_BROWSER_DECODERS,
  VERIFIED_INPUT_FORMATS,
  type VerifiedFormat
} from '../../../src/shared/constants';

let urls: Record<VerifiedFormat, URL>;

beforeAll(() => {
  urls = Object.fromEntries(
    VERIFIED_INPUT_FORMATS.map((format) => [
      format,
      new URL(`../../fixtures/pixelift.${format}`, import.meta.url)
    ])
  ) as Record<VerifiedFormat, URL>;
});

describe('Browser Benchmarks', () => {
  for (const decoder of PIXELIFT_BROWSER_DECODERS) {
    for (const format of VERIFIED_INPUT_FORMATS) {
      bench(`${decoder} - ${format}`, async () => {
        await pixelift(urls[format], { decoder });
      });
    }
  }
});
