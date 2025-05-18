/**
 * An object representing file extensions mapped to their corresponding MIME types.
 * This mapping is used to determine the MIME type of a file based on its extension.
 * All MIME type values are immutable.
 *
 * Properties:
 * - `jpeg`, `jpg`, `jpe`: Represents the image MIME type `image/jpeg`.
 * - `png`: Represents the image MIME type `image/png`.
 * - `gif`: Represents the image MIME type `image/gif`.
 * - `webp`: Represents the image MIME type `image/webp`.
 * - `svg`, `svgz`: Represents the MIME type `image/svg+xml` for scalable vector graphics.
 * - `avif`: Represents the image MIME type `image/avif`.
 * - `jxl`: Represents the image MIME type `image/jxl`.
 * - `heic`: Represents the image MIME type `image/heic`.
 * - `heif`: Represents the image MIME type `image/heif`.
 */
const MIMES_REGISTRY = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  jpe: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  svgz: 'image/svg+xml',
  avif: 'image/avif',
  jxl: 'image/jxl',
  heic: 'image/heic',
  heif: 'image/heif'
} as const;

export type ImageExtension = keyof typeof MIMES_REGISTRY;
export type ImageMimeType = (typeof MIMES_REGISTRY)[ImageExtension];

/**
 * Look up a file extension's MIME type.
 * @param ext The file extension (with or without leading dot).
 * @returns The corresponding MIME type if it exists, otherwise undefined.
 */
export function lookup<E extends string>(
  ext: E
): E extends ImageExtension ? ImageMimeType : undefined;
export function lookup(ext: string): ImageMimeType | undefined {
  const tmp = ext.trim().toLowerCase();
  const dotIndex = tmp.lastIndexOf('.');
  const key = (dotIndex < 0 ? tmp : tmp.slice(dotIndex + 1)) as ImageExtension;
  return MIMES_REGISTRY[key];
}
