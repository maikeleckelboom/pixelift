import { isBrowser } from '@/shared/env';
import { registerDecoder } from './registry';

export async function autoloadDecoders(): Promise<void> {
  if (isBrowser()) {
    const { workerDecoder } = await import('../browser/decoders/worker');
    registerDecoder(workerDecoder);

    const { canvasDecoder } = await import('../browser/decoders/canvas');
    registerDecoder(canvasDecoder);
  } else {
    const { sharpDecoder } = await import('../server/decoders/sharp');
    registerDecoder(sharpDecoder);
  }
}
