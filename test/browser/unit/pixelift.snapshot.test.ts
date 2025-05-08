import { expect, test } from 'vitest';
import { pixelift } from 'pixelift/browser';

import PIXELIFT_PNG_URL from '../../__fixtures__/pixelift.png?url';
import PIXELIFT_JPG_URL from '../../__fixtures__/pixelift.jpg?url';
import PIXELIFT_JPEG_URL from '../../__fixtures__/pixelift.jpeg?url';
import PIXELIFT_GIF_URL from '../../__fixtures__/pixelift.gif?url';
import PIXELIFT_WEBP_URL from '../../__fixtures__/pixelift.webp?url';
import PIXELIFT_SVG_URL from '../../__fixtures__/pixelift.svg?url';

import PIXELIFT_PNG_TXT_URL from '../../__fixtures__/__snapshots__/pixelift.png.txt?url';
import PIXELIFT_JPG_TXT_URL from '../../__fixtures__/__snapshots__/pixelift.jpg.txt?url';
import PIXELIFT_JPEG_TXT_URL from '../../__fixtures__/__snapshots__/pixelift.jpeg.txt?url';
import PIXELIFT_GIF_TXT_URL from '../../__fixtures__/__snapshots__/pixelift.gif.txt?url';
import PIXELIFT_WEBP_TXT_URL from '../../__fixtures__/__snapshots__/pixelift.webp.txt?url';
import PIXELIFT_SVG_TXT_URL from '../../__fixtures__/__snapshots__/pixelift.svg.txt?url';

const PIXELIFT_IMAGES = {
  png: PIXELIFT_PNG_URL,
  jpg: PIXELIFT_JPG_URL,
  jpeg: PIXELIFT_JPEG_URL,
  gif: PIXELIFT_GIF_URL,
  webp: PIXELIFT_WEBP_URL,
  svg: PIXELIFT_SVG_URL
} as const;

const PIXELIFT_IMAGES_SNAPSHOTS = {
  png: PIXELIFT_PNG_TXT_URL,
  jpg: PIXELIFT_JPG_TXT_URL,
  jpeg: PIXELIFT_JPEG_TXT_URL,
  gif: PIXELIFT_GIF_TXT_URL,
  webp: PIXELIFT_WEBP_TXT_URL,
  svg: PIXELIFT_SVG_TXT_URL
} as const;

test.each`
  format    | expected
  ${'png'}  | ${PIXELIFT_IMAGES_SNAPSHOTS.png}
  ${'jpg'}  | ${PIXELIFT_IMAGES_SNAPSHOTS.jpg}
  ${'jpeg'} | ${PIXELIFT_IMAGES_SNAPSHOTS.jpeg}
  ${'gif'}  | ${PIXELIFT_IMAGES_SNAPSHOTS.gif}
  ${'webp'} | ${PIXELIFT_IMAGES_SNAPSHOTS.webp}
  ${'svg'}  | ${PIXELIFT_IMAGES_SNAPSHOTS.svg}
`(
  'decodes $format and has identical pixel data to snapshot',
  async ({ format, expected }) => {
    const url = PIXELIFT_IMAGES[format as keyof typeof PIXELIFT_IMAGES];
    const blob = await fetch(url).then((r) => r.blob());
    const { data } = await pixelift(blob, { decoder: 'offscreenCanvas' });

    const pixelDataString = data.toString();
    const expectedPixelDataString = await fetch(expected).then((r) => r.text());
    expect(pixelDataString).toBe(expectedPixelDataString);
  },
  0
);
