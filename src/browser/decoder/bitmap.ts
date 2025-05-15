// import type { DecodedBrowserInput, OffscreenCanvasDecoderOptions } from '../types';
// import { imageBitmapOptions } from './canvas/options';
// import { createError } from '../../shared/error';
// import { TrackedBitmaps } from './canvas';
//
// async function getBitmapFromDecoded(
//   input: DecodedBrowserInput,
//   options: OffscreenCanvasDecoderOptions | undefined,
//   resources: TrackedBitmaps
// ): Promise<ImageBitmap> {
//   const opts = imageBitmapOptions(options);
//   try {
//     const bmp = await createImageBitmap(input, opts);
//     resources.track(bmp);
//     if (input instanceof VideoFrame) input.close();
//     return bmp;
//   } catch (e) {
//     throw createError.decodingFailed(
//       input.constructor.name,
//       `createImageBitmap failed for ${input.constructor.name}`,
//       e
//     );
//   }
// }
