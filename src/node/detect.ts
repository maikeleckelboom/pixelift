export function detect(buffer: Buffer) {
  // We need at least 12 bytes for most checks
  if (buffer.length < 12) {
    throw new Error('Buffer is too short to detect format');
  }

  // Check the first 12 bytes for common image signatures
  const header = buffer.subarray(0, 12);
  const hexHeader = header.toString('hex');
  const asciiHeader = header.toString('ascii');

  // PNG: Signature 89 50 4E 47
  if (hexHeader.startsWith('89504e47')) return 'png';

  // JPEG: Starts with ffd8
  if (hexHeader.startsWith('ffd8')) return 'jpeg';

  // GIF: ASCII "GIF8"
  if (asciiHeader.startsWith('GIF8')) return 'gif';

  // WEBP: Must be at least 16 bytes; check for "RIFF" at offset 0 and "WEBP" at offset 8
  if (buffer.length >= 16 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'webp';
  }

  // AVIF: In HEIF-based files, a "ftyp" box starting at offset 4 should contain "avif" (case-insensitive)
  if (buffer.length >= 12) {
    const ftypBox = buffer.toString('ascii', 4, 12).toLowerCase();
    if (ftypBox.includes('ftyp') && ftypBox.includes('avif')) return 'avif';
  }

  // TIFF: Check for little-endian ("49492a00") or big-endian ("4d4d002a") header signatures
  if (hexHeader.startsWith('49492a00') || hexHeader.startsWith('4d4d002a')) return 'tiff';

  // SVG: As an XML-based format, convert to text and check for a <svg tag.
  const text = buffer.toString('utf8').trim();
  if (text.startsWith('<svg') || (text.startsWith('<?xml') && text.includes('<svg'))) {
    return 'svg';
  }

  throw new Error(`Unsupported format. Header: ${hexHeader.slice(0, 8)}...`);
}