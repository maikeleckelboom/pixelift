import { beforeAll, describe, expect, test } from 'vitest';
import { decode } from '../src/browser/decoder';

import PIXELIFT_PNG_URL from './assets/pixelift.png?url';
import PIXELIFT_JPG_URL from './assets/pixelift.jpg?url';
import PIXELIFT_JPEG_URL from './assets/pixelift.jpeg?url';
import PIXELIFT_GIF_URL from './assets/pixelift.gif?url';
import PIXELIFT_WEBP_URL from './assets/pixelift.webp?url';

import PIXELIFT_PNG_TXT_URL from './assets/txt/pixelift.png.txt?url';
import PIXELIFT_JPG_TXT_URL from './assets/txt/pixelift.jpg.txt?url';
import PIXELIFT_JPEG_TXT_URL from './assets/txt/pixelift.jpeg.txt?url';
import PIXELIFT_GIF_TXT_URL from './assets/txt/pixelift.gif.txt?url';
import PIXELIFT_WEBP_TXT_URL from './assets/txt/pixelift.webp.txt?url';

const PIXELIFT_IMAGES = {
  png: PIXELIFT_PNG_URL,
  jpg: PIXELIFT_JPG_URL,
  jpeg: PIXELIFT_JPEG_URL,
  gif: PIXELIFT_GIF_URL,
  webp: PIXELIFT_WEBP_URL
} as const;

const PIXELIFT_TEXTS = {
  png: PIXELIFT_PNG_TXT_URL,
  jpg: PIXELIFT_JPG_TXT_URL,
  jpeg: PIXELIFT_JPEG_TXT_URL,
  gif: PIXELIFT_GIF_TXT_URL,
  webp: PIXELIFT_WEBP_TXT_URL
} as const;

const DECODERS = ['webCodecs', 'offscreenCanvas'] as const;

type Format = keyof typeof PIXELIFT_IMAGES;

describe.concurrent.each(DECODERS)(
  '%s decoder',
  (decoder: (typeof DECODERS)[number]) => {
    let blobs: Record<Format, Blob>;

    beforeAll(async () => {
      const entries = await Promise.all(
        (Object.entries(PIXELIFT_IMAGES) as [Format, string][]).map(
          async ([fmt, url]) => {
            const res = await fetch(new URL(url, import.meta.url));
            if (!res.ok) throw new Error(`Failed to fetch ${fmt}: ${res.status}`);
            return [fmt, await res.blob()] as const;
          }
        )
      );
      blobs = Object.fromEntries(entries) as Record<Format, Blob>;
    });

    test.each`
      format    | expected
      ${'png'}  | ${PIXELIFT_TEXTS.png}
      ${'jpg'}  | ${PIXELIFT_TEXTS.jpg}
      ${'jpeg'} | ${PIXELIFT_TEXTS.jpeg}
      ${'gif'}  | ${PIXELIFT_TEXTS.gif}
      ${'webp'} | ${PIXELIFT_TEXTS.webp}
    `('decodes $format correctly', async ({ format, expected }) => {
      const blob = blobs[format as Format];
      const { data } = await decode(blob, { strategy: decoder });
      const expectedText = await fetch(expected).then((r) => r.text());
      expect(data.toString()).toBe(expectedText);
    });
  },
  0
);
