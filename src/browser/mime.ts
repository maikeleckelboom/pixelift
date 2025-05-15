const mimes = {
  '3g2': 'video/3gpp2',
  '3gp': 'video/3gpp',
  '3gpp': 'video/3gpp',
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
  h261: 'video/h261',
  h263: 'video/h263',
  h264: 'video/h264',
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
  jpgv: 'video/jpeg',
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
  m1v: 'video/mpeg',
  m2t: 'video/mp2t',
  m2ts: 'video/mp2t',
  m2v: 'video/mpeg',
  m4s: 'video/iso.segment',
  m4v: 'video/mp4',
  mj2: 'video/mj2',
  mjp2: 'video/mj2',
  mov: 'video/quicktime',
  mp4: 'video/mp4',
  mp4v: 'video/mp4',
  mpe: 'video/mpeg',
  mpeg: 'video/mpeg',
  mpg: 'video/mpeg',
  mpg4: 'video/mp4',
  mts: 'video/mp2t',
  ogv: 'video/ogg',
  png: 'image/png',
  pti: 'image/prs.pti',
  qt: 'video/quicktime',
  sgi: 'image/sgi',
  svg: 'image/svg+xml',
  svgz: 'image/svg+xml',
  t38: 'image/t38',
  tfx: 'image/tiff-fx',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  ts: 'video/mp2t',
  webm: 'video/webm',
  webp: 'image/webp',
  wmf: 'image/wmf'
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
