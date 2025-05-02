import { bench, describe } from 'vitest';
import { decode } from '../src/browser/decoder';

import PIXELIFT_PNG_URL from './assets/pixelift.png?url';
import PIXELIFT_JPG_URL from './assets/pixelift.jpg?url';
import PIXELIFT_JPEG_URL from './assets/pixelift.jpeg?url';
import PIXELIFT_GIF_URL from './assets/pixelift.gif?url';
import PIXELIFT_WEBP_URL from './assets/pixelift.webp?url';

const IMAGES = {
  png: PIXELIFT_PNG_URL,
  jpg: PIXELIFT_JPG_URL,
  jpeg: PIXELIFT_JPEG_URL,
  gif: PIXELIFT_GIF_URL,
  webp: PIXELIFT_WEBP_URL
} as const;

const DECODERS = ['webgl', 'webCodecs', 'offscreenCanvas'] as const;

describe('Benchmarks', async () => {
  const blobs: Record<string, Blob> = Object.fromEntries(
    await Promise.all(
      Object.entries(IMAGES).map(async ([fmt, url]) => {
        const r = await fetch(url);
        if (!r.ok) {
          throw new Error(`Failed to fetch ${url}: ${r.statusText}`);
        }
        return [fmt, await r.blob()] as const;
      })
    )
  );

  describe('Image Decoder Benchmarks', () => {
    for (const decoder of DECODERS) {
      for (const [format, blob] of Object.entries(blobs)) {
        bench(
          `decode ${format} with ${decoder}`,
          async () => {
            await decode(blob, { decoder });
          },
          { iterations: 100, time: 1 }
        );
      }
    }
  });
});
