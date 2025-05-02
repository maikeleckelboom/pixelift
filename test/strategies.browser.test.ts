import { describe, expect, test } from 'vitest';
import { decode } from '../src/browser/decoder';
import PIXELIFT_PNG_URL from './assets/pixelift.png?url';
import PIXELIFT_JPG_URL from './assets/pixelift.jpg?url';
import PIXELIFT_JPEG_URL from './assets/pixelift.jpeg?url';
import PIXELIFT_GIF_URL from './assets/pixelift.gif?url';
import PIXELIFT_WEBP_URL from './assets/pixelift.webp?url';

const PIXELIFT_IMAGES = {
  png: PIXELIFT_PNG_URL,
  jpg: PIXELIFT_JPG_URL,
  jpeg: PIXELIFT_JPEG_URL,
  gif: PIXELIFT_GIF_URL,
  webp: PIXELIFT_WEBP_URL
} as const;

const BROWSER_DECODERS = ['webgl', 'webCodecs', 'offscreenCanvas'] as const;

describe.each(BROWSER_DECODERS)(
  'Using %s decoder',
  (decoder) => {
    test.each(Object.entries(PIXELIFT_IMAGES))(
      'decodes %s correctly',
      async (_, importUrl) => {
        const imageUrl = new URL(importUrl, import.meta.url).href;

        const res = await fetch(imageUrl);
        const blob = await res.blob();
        const { data, width, height } = await decode(blob, { decoder });

        expect(data).toBeDefined();
        expect(width).toBeGreaterThan(0);
        expect(height).toBeGreaterThan(0);
        expect(data.length).toBe(width * height * 4);
      }
    );
  },
  0
);
