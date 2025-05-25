import { isBrowser, isWebWorker } from '@/shared/env';
import { registerDecoder } from './registry';

export async function autoloadDecoders(): Promise<void> {
  if (isBrowser() || isWebWorker()) {
    const { offscreenCanvasDecoder } = await import('../browser/decoders/offscreen-canvas');
    const { offscreenCanvasWorkerDecoder } = await import(
      '../browser/decoders/offscreen-canvas-worker'
    );

    registerDecoder(offscreenCanvasDecoder);
    registerDecoder(offscreenCanvasWorkerDecoder);
  } else {
    const { sharpDecoder } = await import('../server/decoders/sharp');
    registerDecoder(sharpDecoder);
  }
}
