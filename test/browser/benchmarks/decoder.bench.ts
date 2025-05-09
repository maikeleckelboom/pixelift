import { bench, describe } from 'vitest';
import { pixelift } from '../../../src';
import {
  PIXELIFT_BROWSER_DECODERS,
  VERIFIED_INPUT_FORMATS
} from '../../../src/shared/constants';

describe('Browser Benchmarks', () => {
  for (const decoder of PIXELIFT_BROWSER_DECODERS) {
    for (const format of VERIFIED_INPUT_FORMATS) {
      bench(`${decoder} - ${format}`, async () => {
        const url = new URL(`../../__fixtures__/pixelift.${format}`, import.meta.url);
        await pixelift(url, { decoder });
      });
    }
  }
});
