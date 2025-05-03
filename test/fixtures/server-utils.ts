import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, '../assets');

function resolveAssetPath(filename: string): string {
  const full = path.join(ASSETS_DIR, filename);
  if (!full.startsWith(ASSETS_DIR)) {
    throw new Error('Path traversal attempt detected');
  }
  return full;
}

export function loadAsset(name: string): Buffer {
  return fs.readFileSync(resolveAssetPath(name));
}

export const assetsDir = ASSETS_DIR;

export { path, resolveAssetPath };
