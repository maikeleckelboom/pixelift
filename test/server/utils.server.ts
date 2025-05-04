import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const ASSETS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../assets');

export function loadAsset(name: string): Buffer {
  return fs.readFileSync(path.join(ASSETS_DIR, name));
}

export const assetsDir = ASSETS_DIR;
