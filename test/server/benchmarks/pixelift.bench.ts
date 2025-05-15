import { bench, describe } from 'vitest';
import { pixelift } from '../../../src/server';
import { PIXELIFT_SERVER_DECODERS, LOSSLESS_TEST_FORMATS } from '../../fixtures/constants';

describe('Server Benchmarks', () => {
  for (const decoder of PIXELIFT_SERVER_DECODERS) {
    for (const format of LOSSLESS_TEST_FORMATS) {
      bench(
        `${decoder} - ${format}`,
        async () => {
          await pixelift(`./test/fixtures/assets/pixelift.${format}`, { decoder });
        },
        {
          iterations: 100,
          warmupTime: 0.5
        }
      );
    }
  }
});
