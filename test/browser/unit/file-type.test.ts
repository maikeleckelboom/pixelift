import { describe, test, expect, beforeAll } from 'vitest';
import { getFileType, getFileExtension } from '../../../src/shared/file-type';
import { MIME_MAP } from '../../../src/shared/constants';
import { setupBrowserEnvironment } from '../../fixtures/setup-browser-environment';

describe('File Type Utilities', () => {
  beforeAll(() => {
    setupBrowserEnvironment();
  });

  describe('getFileExtension', () => {
    test('basic cases', () => {
      expect(getFileExtension('https://example.com/image.jpg')).toBe('jpg');
      expect(getFileExtension(new URL('https://example.com/video.mp4'))).toBe('mp4');
      expect(getFileExtension('file.unknown')).toBe('unknown');
    });

    test('handles query strings & fragments', () => {
      expect(getFileExtension('https://cdn.test.com/photo.png?version=123')).toBe('png');
      expect(getFileExtension('https://site.com/doc.pdf#page=2')).toBe('pdf');
    });

    test('uppercase extensions are normalized to lowercase', () => {
      expect(getFileExtension('IMAGE.JPG')).toBe('jpg');
      expect(getFileExtension('video.MP4?auth=true')).toBe('mp4');
    });

    test('data URIs return the extension after the slash', () => {
      expect(getFileExtension('data:image/svg+xml;base64,AAA')).toBe('svg+xml');
    });

    test('Windows file paths', () => {
      expect(getFileExtension('C:\\Users\\You\\report.docx')).toBe('docx');
    });

    test('multiple dots picks last segment', () => {
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
      expect(getFileExtension('my.photo.final.jpeg')).toBe('jpeg');
    });

    test('files with trailing dot or no dot', () => {
      expect(getFileExtension('file.')).toBe('');
      expect(getFileExtension('filename')).toBe('');
    });

    test('dot-files and unicode names', () => {
      expect(getFileExtension('.env')).toBe('');
      expect(getFileExtension('файл.фото')).toBe('фото');
    });
  });

  describe('getFileType', () => {
    test('explicit options.type always wins', () => {
      expect(getFileType('something.ext', { type: 'application/x-custom' })).toBe(
        'application/x-custom'
      );
    });

    test('Blob and File objects', () => {
      const pngBlob = new Blob([], { type: 'image/png' });
      expect(getFileType(pngBlob)).toBe('image/png');

      const svgFile = new File([], 'vector.svg', { type: 'image/svg+xml' });
      expect(getFileType(svgFile)).toBe('image/svg+xml');

      // Blob with no type should fall through
      const emptyBlob = new Blob([]);
      expect(getFileType(emptyBlob)).toBe('image/png');
    });

    test('URL and string inputs, with queries & uppercase', () => {
      expect(getFileType('https://x.test/a.WEBP?cache=false')).toBe('image/webp');
      expect(getFileType(new URL('https://x.test/b.MOV#t=10'))).toBe(MIME_MAP.mov);
    });

    test('data URI inputs', () => {
      expect(getFileType('data:image/jpeg;base64,AAA')).toBe('image/jpeg');
      expect(getFileType('data:audio/mp3;base64,AAA')).toBe('audio/mp3');
    });

    test('HTMLCanvasElement and HTMLImageElement', () => {
      const canvas = new globalThis.HTMLCanvasElement();
      expect(getFileType(canvas)).toBe('image/png');

      const img = new globalThis.HTMLImageElement();
      img.src = 'https://cdn.site/img.bmp';
      expect(getFileType(img)).toBe('image/bmp');
    });

    test('HTMLVideoElement via currentSrc', () => {
      const video = new globalThis.HTMLVideoElement();
      video.src = 'https://videos.test/movie.ogv';
      expect(getFileType(video)).toBe('video/ogg');
    });

    test('plain objects or unsupported inputs fallback', () => {
      expect(getFileType({} as never)).toBe('image/png');
      expect(getFileType(null as never)).toBe('image/png');
      expect(getFileType(undefined as never)).toBe('image/png');
      expect(getFileType(123 as never)).toBe('image/png');
    });

    test('empty string yields fallback', () => {
      expect(getFileType('')).toBe('image/png');
    });
  });
});
