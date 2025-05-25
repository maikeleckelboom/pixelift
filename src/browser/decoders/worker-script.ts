import { offscreenCanvasDecoder } from './offscreen-canvas.ts';
import type { PixelData } from '@/types.ts';

self.onmessage = async (event: MessageEvent) => {
  const { id, input, options } = event.data;
  const scope = self as DedicatedWorkerGlobalScope;
  try {
    const result = await offscreenCanvasDecoder.decode(input, options);
    const clonedResult: PixelData = {
      data: result.data.slice(0),
      width: result.width,
      height: result.height
    };
    scope.postMessage({ id, result: clonedResult }, [clonedResult.data.buffer]);
  } catch (error) {
    scope.postMessage({
      id,
      error: (error as Error).message
    });
  }
};
