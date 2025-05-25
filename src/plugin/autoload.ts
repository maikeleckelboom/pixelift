import { isBrowser } from '@/shared/env';
import { registerDecoder } from './registry';

export async function autoloadDecoders(): Promise<void> {
  if (isBrowser()) {
    const { workerDecoder } = await import('../browser/decoders/worker');
    registerDecoder(workerDecoder);

    const { offscreenCanvasDecoder } = await import(
      '../browser/decoders/offscreen-canvas.ts'
    );
    registerDecoder(offscreenCanvasDecoder);
  } else {
    const { sharpDecoder } = await import('../server/decoders/sharp');
    registerDecoder(sharpDecoder);
  }
}
