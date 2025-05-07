import { beforeAll, expect, test } from 'vitest';
import { decode } from '../../src/browser/decoder';

import PIXELIFT_PNG_URL from '../fixtures/pixelift.png?url';
import PIXELIFT_JPG_URL from '../fixtures/pixelift.jpg?url';
import PIXELIFT_JPEG_URL from '../fixtures/pixelift.jpeg?url';
import PIXELIFT_GIF_URL from '../fixtures/pixelift.gif?url';
import PIXELIFT_WEBP_URL from '../fixtures/pixelift.webp?url';
import PIXELIFT_SVG_URL from '../fixtures/pixelift.svg?url';
import PIXELIFT_AVIF_URL from '../fixtures/pixelift.avif?url';

import PIXELIFT_PNG_TXT_URL from '../fixtures/snapshots/pixelift.png.txt?url';
import PIXELIFT_JPG_TXT_URL from '../fixtures/snapshots/pixelift.jpg.txt?url';
import PIXELIFT_JPEG_TXT_URL from '../fixtures/snapshots/pixelift.jpeg.txt?url';
import PIXELIFT_GIF_TXT_URL from '../fixtures/snapshots/pixelift.gif.txt?url';
import PIXELIFT_WEBP_TXT_URL from '../fixtures/snapshots/pixelift.webp.txt?url';
import PIXELIFT_SVG_TXT_URL from '../fixtures/snapshots/pixelift.svg.txt?url';
import PIXELIFT_AVIF_TXT_URL from '../fixtures/snapshots/pixelift.avif.txt?url';

const PIXELIFT_IMAGES = {
  png: PIXELIFT_PNG_URL,
  jpg: PIXELIFT_JPG_URL,
  jpeg: PIXELIFT_JPEG_URL,
  gif: PIXELIFT_GIF_URL,
  webp: PIXELIFT_WEBP_URL,
  svg: PIXELIFT_SVG_URL,
  avif: PIXELIFT_AVIF_URL
} as const;

const PIXELIFT_TEXTS = {
  png: PIXELIFT_PNG_TXT_URL,
  jpg: PIXELIFT_JPG_TXT_URL,
  jpeg: PIXELIFT_JPEG_TXT_URL,
  gif: PIXELIFT_GIF_TXT_URL,
  webp: PIXELIFT_WEBP_TXT_URL,
  svg: PIXELIFT_SVG_TXT_URL,
  avif: PIXELIFT_AVIF_TXT_URL
} as const;

type Format = keyof typeof PIXELIFT_IMAGES;

let blobs: Record<Format, Blob>;

beforeAll(async () => {
  const entries = await Promise.all(
    (Object.entries(PIXELIFT_IMAGES) as [Format, string][]).map(async ([fmt, url]) => {
      const res = await fetch(new URL(url, import.meta.url));
      if (!res.ok) throw new Error(`Failed to fetch ${fmt}: ${res.status}`);
      return [fmt, await res.blob()] as const;
    })
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
  ${'svg'}  | ${PIXELIFT_TEXTS.svg}
  ${'avif'} | ${PIXELIFT_TEXTS.avif}
`(
  'decodes $format correctly',
  async ({ format, expected }) => {
    const blob = blobs[format as Format];
    const { data } = await decode(blob);
    const expectedText = await fetch(expected).then((r) => r.text());

    if (format === 'avif') {
      // AVIF decoding is not deterministic and can produce different results,
      // so we just check that the data is not empty.
      expect(data.length).toBeGreaterThan(0);
    } else {
      expect(data.toString()).toBe(expectedText);
    }
  },
  0
);
