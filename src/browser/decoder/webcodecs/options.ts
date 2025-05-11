/**
 * Creates configuration options for the WebCodecs ImageDecoder API.
 *
 * @param {ArrayBuffer} data - The raw binary data of the image.
 * @param type
 * @returns {ImageDecoderInit} Configuration object for initializing an ImageDecoder instance.
 */
export function imageDecoderOptions(
  data: ImageBufferSource,
  type: string
): ImageDecoderInit {
  return {
    data: data,
    type: type,
    colorSpaceConversion: 'none'
  };
}
