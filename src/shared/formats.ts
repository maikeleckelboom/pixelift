export const lossyImageFormats = [
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['gif', 'image/gif'],
  ['webp', 'image/webp'],
  ['avif', 'image/avif'],
  ['jxl', 'image/jxl'],
  ['heic', 'image/heic'],
  ['heif', 'image/heif'],
  ['jp2', 'image/jp2'],
  ['j2k', 'image/j2k']
] as const;

export const losslessImageFormats = [
  ['png', 'image/png'],
  ['svg', 'image/svg+xml'],
  ['bmp', 'image/bmp'],
  ['tiff', 'image/tiff'],
  ['tif', 'image/tiff'],
  ['ico', 'image/x-icon'],
  ['apng', 'image/apng'],
  ['qoi', 'image/qoi'],
  ['exr', 'image/exr']
] as const;

type FormatTuple = readonly [string, string];

type ExtractExtensions<T extends readonly FormatTuple[]> = T[number][0];
type ExtractMimeTypes<T extends readonly FormatTuple[]> = T[number][1];

export function listLossyFormats(): LossyExtension[] {
  return lossyImageFormats.map(([ext]) => ext);
}

export function listLosslessFormats(): LosslessExtension[] {
  return losslessImageFormats.map(([ext]) => ext);
}

// Exported types
export type LossyExtension = ExtractExtensions<typeof lossyImageFormats>;
export type LosslessExtension = ExtractExtensions<typeof losslessImageFormats>;
export type SupportedExtension = LossyExtension | LosslessExtension;

export type LossyMimeType = ExtractMimeTypes<typeof lossyImageFormats>;
export type LosslessMimeType = ExtractMimeTypes<typeof losslessImageFormats>;
export type SupportedMimeType = LossyMimeType | LosslessMimeType;

export const extensionToMimeTypeMap: Record<SupportedExtension, SupportedMimeType> =
  Object.fromEntries([...lossyImageFormats, ...losslessImageFormats]) as Record<
    SupportedExtension,
    SupportedMimeType
  >;
