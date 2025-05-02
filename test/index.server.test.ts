import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, test } from 'vitest';
import { pixelift } from '../src';

const formats = ['jpg', 'jpeg', 'png', 'gif', 'webp'] as const;

type Format = (typeof formats)[number];

describe('Server Pixelift Decode', () => {
  let buffers: Record<Format, Buffer>;

  beforeAll(() => {
    buffers = Object.fromEntries(
      formats.map((format) => {
        const url = new URL(`./assets/pixelift.${format}`, import.meta.url);
        return [format, readFileSync(url)] as const;
      })
    ) as Record<Format, Buffer>;
  });

  test.concurrent.each(formats)(
    'should decode a %s image from buffer',
    async (format) => {
      const result = await pixelift(buffers[format]);

      expect(result.width).toBeDefined();
      expect(result.height).toBeDefined();
      expect(result.data.filter(Boolean).length).toBeGreaterThan(0);
    }
  );
});
