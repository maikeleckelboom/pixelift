import { beforeAll, describe, expect, test } from 'vitest';
import { VERIFIED_INPUT_FORMATS, type VerifiedFormat } from '../src/shared/constants';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pixelift } from '../src';

const buffers: Partial<Record<VerifiedFormat, Buffer>> = {};
const urls: Partial<Record<VerifiedFormat, URL>> = {};

beforeAll(() => {
  for (const format of VERIFIED_INPUT_FORMATS) {
    const resourceUrl = new URL(`./assets/pixelift.${format}`, import.meta.url);
    urls[format] = resourceUrl;
    buffers[format] = readFileSync(resourceUrl);
  }
});

describe('Pixelift Browser vs Server Hash Snapshots', () => {
  test.each(VERIFIED_INPUT_FORMATS)(
    'format `%s` produces identical hash and data',
    async (format: VerifiedFormat) => {
      // Browser result (URL input)
      const browserResult = await pixelift(urls[format] as URL);
      const browserHash = hashData(browserResult.data);
      await expect(browserHash).toMatchFileSnapshot(
        `./__snapshots__/browser/${format}.sha256`
      );

      // Server result (Buffer input)
      const serverResult = await pixelift(buffers[format] as Buffer);
      const serverHash = hashData(serverResult.data);
      await expect(serverHash).toMatchFileSnapshot(
        `./__snapshots__/server/${format}.sha256`
      );

      expect(browserHash).toEqual(serverHash);
    }
  );
});

function hashData(data: Uint8ClampedArray): string {
  return createHash('sha256').update(Buffer.from(data.buffer)).digest('hex');
}
