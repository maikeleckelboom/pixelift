// todo: link source mrmime -> mime-db
const mimes = {
  apng: 'image/apng',
  avci: 'image/avci',
  avcs: 'image/avcs',
  avif: 'image/avif',
  bmp: 'image/bmp',
  btf: 'image/prs.btif',
  btif: 'image/prs.btif',
  cgm: 'image/cgm',
  dib: 'image/bmp',
  dpx: 'image/dpx',
  drle: 'image/dicom-rle',
  emf: 'image/emf',
  exr: 'image/aces',
  fits: 'image/fits',
  g3: 'image/g3fax',
  gif: 'image/gif',
  heic: 'image/heic',
  heics: 'image/heic-sequence',
  heif: 'image/heif',
  heifs: 'image/heif-sequence',
  hej2: 'image/hej2k',
  hsj2: 'image/hsj2',
  ief: 'image/ief',
  jhc: 'image/jphc',
  jls: 'image/jls',
  jp2: 'image/jp2',
  jpe: 'image/jpeg',
  jpeg: 'image/jpeg',
  jpf: 'image/jpx',
  jpg: 'image/jpeg',
  jpg2: 'image/jp2',
  jpgm: 'image/jpm',
  jph: 'image/jph',
  jpm: 'image/jpm',
  jpx: 'image/jpx',
  jxl: 'image/jxl',
  jxr: 'image/jxr',
  jxra: 'image/jxra',
  jxrs: 'image/jxrs',
  jxs: 'image/jxs',
  jxsc: 'image/jxsc',
  jxsi: 'image/jxsi',
  jxss: 'image/jxss',
  ktx: 'image/ktx',
  ktx2: 'image/ktx2',
  png: 'image/png',
  sgi: 'image/sgi',
  pti: 'image/prs.pti',
  svg: 'image/svg+xml',
  svgz: 'image/svg+xml',
  t38: 'image/t38',
  tfx: 'image/tiff-fx',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  wmf: 'image/wmf',
  webp: 'image/webp'
} as const;

export type Extension = keyof typeof mimes;
export type MimeType = (typeof mimes)[Extension];

/**
 * Look up a file extension's MIME type.
 * @param ext The file extension (with or without leading dot).
 * @returns The corresponding MIME type if it exists, otherwise undefined.
 */
export function lookup<E extends string>(
  ext: E
): E extends Extension ? MimeType : undefined;
export function lookup(ext: string): MimeType | undefined {
  const tmp = ext.trim().toLowerCase();
  const dotIndex = tmp.lastIndexOf('.');
  const key = (dotIndex < 0 ? tmp : tmp.slice(dotIndex + 1)) as Extension;
  return mimes[key];
}
