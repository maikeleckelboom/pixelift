import { bench, describe } from 'vitest';
import { pixelift } from 'pixelift/browser';

import PIXELIFT_PNG_URL from '../assets/pixelift.png?url';
import PIXELIFT_JPG_URL from '../assets/pixelift.jpg?url';
import PIXELIFT_JPEG_URL from '../assets/pixelift.jpeg?url';
import PIXELIFT_GIF_URL from '../assets/pixelift.gif?url';
import PIXELIFT_WEBP_URL from '../assets/pixelift.webp?url';

const IMAGES = {
  png: PIXELIFT_PNG_URL,
  jpg: PIXELIFT_JPG_URL,
  jpeg: PIXELIFT_JPEG_URL,
  gif: PIXELIFT_GIF_URL,
  webp: PIXELIFT_WEBP_URL
} as const;

const DECODERS = ['webCodecs', 'offscreenCanvas'] as const;

const blobs: Record<string, Blob> = Object.fromEntries(
  await Promise.all(
    Object.entries(IMAGES).map(async ([fmt, url]) => {
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`);
      }
      const blob = await resp.blob();
      return [fmt, blob] as const;
    })
  )
);

describe('Image Decoder Benchmarks', () => {
  for (const decoder of DECODERS) {
    for (const [format, blob] of Object.entries(blobs)) {
      bench(
        `decode ${format} with ${decoder}`,
        async () => {
          await pixelift(blob, { strategy: decoder });
        },
        {
          iterations: 100,
          time: 1,
          warmupTime: 0.5
        }
      );
    }
  }
});
