import { bench, describe, beforeAll } from 'vitest';
import { readFile } from 'fs/promises';
import { pixelift } from '../../../src/server';
import { PIXELIFT_SERVER_DECODERS, LOSSLESS_TEST_FORMATS } from '../../fixtures/constants';
import { getFixtureAssetPath } from '../../fixtures/utils/shared-asset-helpers';

const buffers = new Map<string, Buffer>();

beforeAll(async () => {
  // Preload every format once
  await Promise.all(
    LOSSLESS_TEST_FORMATS.map(async (format) => {
      const filePath = getFixtureAssetPath(format);
      const buf = await readFile(filePath);
      buffers.set(format, buf);
    })
  );
});

describe('Server Benchmarks', () => {
  for (const decoder of PIXELIFT_SERVER_DECODERS) {
    describe(decoder, () => {
      for (const format of LOSSLESS_TEST_FORMATS) {
        bench(
          `${format} • ${decoder}`,
          async () => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            await pixelift(buffers.get(format)!, { decoder });
          },
          {
            // Run for ~500 ms, with a 200 ms warm‑up phase
            time: 500,
            warmupTime: 200
            // Optionally clear caches between runs:
            // setup: () => { clearPixeliftCache(); },
          }
        );
      }
    });
  }
});
