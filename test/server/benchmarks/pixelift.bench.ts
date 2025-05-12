import { bench, describe } from 'vitest';
import { pixelift } from '../../../src/server';
import {
  PIXELIFT_SERVER_DECODERS,
  VERIFIED_INPUT_FORMATS
} from '../../../src/shared/constants';

describe('Server Benchmarks', () => {
  for (const decoder of PIXELIFT_SERVER_DECODERS) {
    for (const format of VERIFIED_INPUT_FORMATS) {
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
