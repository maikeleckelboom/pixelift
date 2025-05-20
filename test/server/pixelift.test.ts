import { readFileSync } from 'node:fs';
import { beforeAll, expect, test } from 'vitest';
import { pixelift } from '../../src';
import {
  LOSSLESS_TEST_FORMATS,
  type LosslessTestFormat,
  makeSnapshotKey
} from '../fixtures/constants';
import { hashSHA256 } from '../fixtures/utils/hash-sha256';

const buffers: Partial<Record<LosslessTestFormat, Buffer>> = {};

beforeAll(() => {
  for (const format of LOSSLESS_TEST_FORMATS) {
    const resourceUrl = new URL(`../fixtures/assets/pixelift.${format}`, import.meta.url);
    buffers[format] = readFileSync(resourceUrl);
  }
});

const formatCases = LOSSLESS_TEST_FORMATS.map((fmt, idx) => [fmt, idx + 1] as const);

test.each(formatCases)(
  '[server] %s | case %d',
  async (format, caseIndex) => {
    const result = await pixelift(buffers[format] as Buffer);
    const hash = await hashSHA256(result.data);

    expect(result.width).toBeDefined();
    expect(result.height).toBeDefined();
    expect(result.data).toBeInstanceOf(Uint8ClampedArray);
    expect(hash).toMatchSnapshot(makeSnapshotKey(format, caseIndex));
  },
  30_000
);
