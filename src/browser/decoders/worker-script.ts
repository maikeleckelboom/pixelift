import { canvasDecoder } from './canvas';

self.onmessage = async (event: MessageEvent) => {
  const { id, input, options } = event.data;

  try {
    const result = await canvasDecoder.decode(input, options);
    (self as DedicatedWorkerGlobalScope).postMessage({ id, result });
  } catch (err) {
    (self as DedicatedWorkerGlobalScope).postMessage({
      id,
      error: (err as Error).message
    });
  }
};
