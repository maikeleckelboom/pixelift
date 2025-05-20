import { beforeAll, bench, describe } from 'vitest';
import { pixelift } from '../../../src';
import {
  LOSSLESS_TEST_FORMATS,
  type LosslessTestFormat,
  PIXELIFT_BROWSER_DECODERS
} from '../../fixtures/constants';

// We'll store ArrayBuffers keyed by format
let assets = {} as Record<LosslessTestFormat, ArrayBuffer>;

beforeAll(async () => {
  const entries = await Promise.all(
    LOSSLESS_TEST_FORMATS.map(async (format) => {
      const resp = await fetch(`/fixtures/${format}`); // adjust path as needed
      const buffer = await resp.arrayBuffer();
      return [format, buffer] as const;
    })
  );
  assets = Object.fromEntries(entries) as Record<LosslessTestFormat, ArrayBuffer>;
});

describe('Browser Benchmarks', () => {
  for (const decoder of PIXELIFT_BROWSER_DECODERS) {
    describe(decoder, () => {
      for (const format of LOSSLESS_TEST_FORMATS) {
        bench(
          `${format} • ${decoder}`,
          async () => {
            await pixelift(assets[format], { decoder });
          },
          {
            time: 500,
            warmupTime: 200
          }
        );
      }
    });
  }
});
