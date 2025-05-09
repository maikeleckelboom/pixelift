/**
 * Creates configuration options for the WebCodecs ImageDecoder API.
 *
 * @param {ArrayBuffer} buffer - The raw binary data of the image.
 * @param {Blob | File} input - The original Blob or File object representing the image.
 * @returns {ImageDecoderInit} Configuration object for initializing an ImageDecoder instance.
 */
export function imageDecoderOptions(buffer: ArrayBuffer, input: Blob): ImageDecoderInit {
  return {
    type: input.type,
    data: buffer,
    colorSpaceConversion: 'none'
  };
}
