export function detect(buffer: Buffer): string {
  // Need at least 16 bytes for most headers
  if (buffer.length < 16) {
    throw new Error('Buffer is too short to detect format');
  }

  // Use subarray (both subarray and slice return views on the same memory)
  const headerBytes = buffer.subarray(0, 16);
  const hexHeader = Buffer.from(headerBytes).toString('hex');
  const asciiHeader = Buffer.from(headerBytes).toString('ascii');

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))
  ) {
    return 'png';
  }

  // JPEG: any file starting with 0xFFD8
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    return 'jpeg';
  }

  // GIF: "GIF87a" or "GIF89a"
  if (asciiHeader.startsWith('GIF87a') || asciiHeader.startsWith('GIF89a')) {
    return 'gif';
  }

  // BMP: starts with "BM"
  if (asciiHeader.startsWith('BM')) {
    return 'bmp';
  }

  // ICO / CUR: header "00 00 01 00" (icon) or "00 00 02 00" (cursor)
  if (buffer.length >= 4) {
    const icoHeader = buffer.subarray(0, 4).toString('hex');
    if (icoHeader === '00000100') return 'ico';
    if (icoHeader === '00000200') return 'cur';
  }

  // WebP: "RIFF" at offset 0 and "WEBP" at offset 8
  if (
    buffer.length >= 16 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp';
  }

  // HEIF/AVIF: look for an 'ftyp' box at offset 4
  if (buffer.length >= 12) {
    const ftypBox = buffer.subarray(4, 12).toString('ascii').toLowerCase();
    if (ftypBox.includes('ftyp')) {
      if (ftypBox.includes('avif')) return 'avif';
      if (ftypBox.includes('heic') || ftypBox.includes('heif') || ftypBox.includes('mif1')) {
        return 'heic';
      }
    }
  }

  // TIFF: little-endian "49492a00" or big-endian "4d4d002a"
  if (hexHeader.startsWith('49492a00') || hexHeader.startsWith('4d4d002a')) {
    return 'tiff';
  }

  // JPEG 2000 (JP2): header is 00 00 00 0c 6a5020200d0a870a (12 bytes)
  if (buffer.length >= 12 && buffer.subarray(0, 12).toString('hex') === '0000000c6a5020200d0a870a') {
    return 'jp2';
  }

  // JPEG XL (JXL): header is 00 00 00 0c 4a584c200d0a870a (12 bytes)
  if (buffer.length >= 12 && buffer.subarray(0, 12).toString('hex') === '0000000c4a584c200d0a870a') {
    return 'jxl';
  }

  // OpenEXR: header "76 2F 31 01"
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString('hex') === '762f3101') {
    return 'exr';
  }

  // FLIF: starts with ASCII "FLIF"
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === 'FLIF') {
    return 'flif';
  }

  // SVG: text-based file starting with "<svg" or XML header with <svg inside
  const text = buffer.toString('utf8').trim();
  if (text.startsWith('<svg') || (text.startsWith('<?xml') && text.includes('<svg'))) {
    return 'svg';
  }

  throw new Error(`Unsupported format. Header: ${hexHeader.slice(0, 16)}...`);
}
