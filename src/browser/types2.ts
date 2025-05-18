// import { toBlob } from './blob';
// import { createError, PixeliftError } from '../shared/error';
// import { withAutoClose } from './utils/auto-close';
// import type {
//   BrowserInput,
//   BrowserOptions,
//   OffscreenCanvasDecoderOptions,
//   OffscreenCanvasOptions
// } from './types';
// import {
//   isAbortError,
//   isDecodedInput,
//   isEncodedInput,
//   isMediaElement,
//   isRawData
// } from '../shared/guards';
// import {
//   DEFAULT_CANVAS_CONTEXT_SETTINGS,
//   DEFAULT_IMAGE_SMOOTHING_SETTINGS,
//   imageBitmapOptions
// } from './decoder/canvas/options';
// import { createCanvasAndContext } from './decoder/canvas/utils';
// import { createPixelData } from '../shared/factory';
// import type { PixelData } from '../types';
//
// async function createImageBitmapFromInput(
//   input: BrowserInput,
//   options?: OffscreenCanvasDecoderOptions
// ): Promise<ImageBitmap> {
//   const bitmapOpts = imageBitmapOptions(options);
//
//   if (isDecodedInput(input)) {
//     if (input instanceof ImageBitmap) {
//       return await createImageBitmap(input, bitmapOpts);
//     }
//     if (input instanceof VideoFrame) {
//       return withAutoClose(input, (frame) => createImageBitmap(frame, bitmapOpts));
//     }
//     return await createImageBitmap(input, bitmapOpts);
//   }
//
//   if (isEncodedInput(input)) {
//     if (isMediaElement(input)) {
//       if (
//         input instanceof HTMLVideoElement &&
//         input.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
//       ) {
//         throw createError.runtimeError('Video element not ready for frame capture');
//       }
//       return await createImageBitmap(input, bitmapOpts);
//     }
//
//     if (typeof SVGElement !== 'undefined' && input instanceof SVGElement) {
//       const blob = new Blob([input.outerHTML], { type: 'image/svg+xml' });
//       return await createImageBitmap(blob, bitmapOpts);
//     }
//
//     let blobInput: Blob;
//     if (input instanceof Blob) {
//       blobInput = input;
//     } else if (
//       isRawData(input) ||
//       input instanceof ReadableStream ||
//       input instanceof Response
//     ) {
//       // Используем основной toBlob вашей библиотеки
//       blobInput = await toBlob(input, options as BrowserOptions);
//     } else {
//       throw createError.invalidInput(
//         'Unsupported encoded input type for canvas path',
//         typeof input
//       );
//     }
//     return await createImageBitmap(blobInput, bitmapOpts);
//   }
//   throw createError.invalidInput(
//     'Unsupported BrowserImageInput subtype for canvas path',
//     typeof input
//   );
// }
//
// export async function decodeWithCanvasViaBrowserOptions(
//   input: BrowserInput,
//   browserOptions?: BrowserOptions
// ): Promise<PixelData> {
//   const canvasOptions: OffscreenCanvasDecoderOptions =
//     browserOptions?.decoder === 'offscreenCanvas'
//       ? browserOptions
//       : {
//           decoder: 'offscreenCanvas',
//           options: browserOptions?.options as OffscreenCanvasOptions | undefined
//         };
//   const sourceBitmap = await createImageBitmapFromInput(input, canvasOptions);
//   return withAutoClose(sourceBitmap, async (sBitmap) => {
//     const [canvas, context] = createCanvasAndContext(
//       sBitmap.width,
//       sBitmap.height,
//       canvasOptions
//     );
//     context.drawImage(sBitmap, 0, 0);
//     const targetColorSpace: PredefinedColorSpace =
//       canvasOptions?.options?.colorSpace || 'srgb';
//     const imgData = context.getImageData(0, 0, canvas.width, canvas.height, {
//       colorSpace: targetColorSpace
//     });
//     return createPixelData(imgData.data, imgData.width, imgData.height, targetColorSpace);
//   });
// }
//
// async function limitedInputToBlob(
//   input:
//     | string
//     | URL
//     | Response
//     | Blob
//     | ArrayBuffer
//     | BufferSource
//     | ReadableStream<Uint8Array>,
//   fetchOpts?: RequestInit
// ): Promise<Blob> {
//   if (typeof input === 'string' || input instanceof URL) {
//     try {
//       const response = await fetch(input.toString(), fetchOpts);
//       return await response.blob();
//     } catch (error) {
//       if (error instanceof PixeliftError) throw error;
//       if (isAbortError(error)) throw createError.aborted();
//       throw createError.networkError(`Failed to fetch resource: ${input.toString()}`, {
//         cause: error
//       });
//     }
//   }
//
//   if (input instanceof Response) {
//     if (!input.body) throw createError.runtimeError('Response body is null');
//     return await input.blob();
//   }
//
//   if (input instanceof Blob) {
//     return input;
//   }
//
//   if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
//     return new Blob([input]);
//   }
//
//   if (input instanceof ReadableStream) {
//     const reader = input.getReader();
//     const chunks: Uint8Array[] = [];
//     let abortHandler: (() => void) | undefined;
//     const signal = fetchOpts?.signal;
//     try {
//       if (signal) {
//         if (signal.aborted) throw createError.aborted();
//         abortHandler = () => reader.cancel().catch(() => {});
//         signal.addEventListener('abort', abortHandler);
//       }
//
//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;
//         chunks.push(value);
//       }
//       return new Blob(chunks);
//     } catch (error) {
//       if (isAbortError(error)) throw createError.aborted();
//       throw createError.runtimeError('Stream processing failed', { cause: error });
//     } finally {
//       if (abortHandler && signal) {
//         signal.removeEventListener('abort', abortHandler);
//       }
//       try {
//         reader.releaseLock();
//       } catch {
//         // Ignore errors from releaseLock
//       }
//     }
//   }
//
//   throw createError.invalidInput(
//     'string, URL, Response, Blob, ArrayBuffer, BufferSource, or ReadableStream',
//     typeof input
//   );
// }
//
// export function blobFromReadableStream(
//   input: ReadableStream<Uint8Array>,
//   fetchOpts?: RequestInit
// ): Promise<Blob> {
//   return limitedInputToBlob(input, fetchOpts);
// }
//
// export function createOffscreenCanvasAndContext(
//   width: number,
//   height: number,
//   browserOptions?: BrowserOptions
// ): [OffscreenCanvas, OffscreenCanvasRenderingContext2D] {
//   if (width <= 0 || height <= 0) {
//     throw createError.invalidInput(
//       'Canvas dimensions must be positive',
//       `width: ${width}, height: ${height}`
//     );
//   }
//
//   const canvas = new OffscreenCanvas(width, height);
//
//   let contextSettings: CanvasRenderingContext2DSettings = {
//     ...DEFAULT_CANVAS_CONTEXT_SETTINGS
//   };
//   let smoothingSettings: CanvasImageSmoothing = { ...DEFAULT_IMAGE_SMOOTHING_SETTINGS };
//
//   if (browserOptions?.decoder === 'offscreenCanvas' && browserOptions.options) {
//     const opts = browserOptions.options as OffscreenCanvasOptions; // Уточнение типа
//     contextSettings = {
//       alpha: opts.alpha ?? contextSettings.alpha,
//       colorSpace: opts.colorSpace ?? contextSettings.colorSpace,
//       desynchronized: opts.desynchronized ?? contextSettings.desynchronized,
//       willReadFrequently: opts.willReadFrequently ?? contextSettings.willReadFrequently
//     };
//     smoothingSettings = {
//       imageSmoothingEnabled:
//         opts.imageSmoothingEnabled ?? smoothingSettings.imageSmoothingEnabled,
//       imageSmoothingQuality:
//         opts.imageSmoothingQuality ?? smoothingSettings.imageSmoothingQuality
//     };
//   } else if (!browserOptions?.decoder) {
//     const genericOpts = browserOptions?.options as
//       | Partial<OffscreenCanvasOptions>
//       | undefined;
//     contextSettings = {
//       alpha: genericOpts?.alpha ?? contextSettings.alpha,
//       colorSpace: genericOpts?.colorSpace ?? contextSettings.colorSpace
//     };
//     smoothingSettings = {
//       imageSmoothingEnabled:
//         genericOpts?.imageSmoothingEnabled ?? smoothingSettings.imageSmoothingEnabled,
//       imageSmoothingQuality:
//         genericOpts?.imageSmoothingQuality ?? smoothingSettings.imageSmoothingQuality
//     };
//   }
//
//   const context = canvas.getContext('2d', contextSettings);
//   if (!context) {
//     throw createError.runtimeError('Failed to create OffscreenCanvasRenderingContext2D');
//   }
//
//   context.imageSmoothingEnabled = smoothingSettings.imageSmoothingEnabled;
//   context.imageSmoothingQuality = smoothingSettings.imageSmoothingQuality;
//
//   return [canvas, context];
// }
