import { describe, expect, it } from 'vitest';
import { VERIFIED_INPUT_FORMATS } from '../src/shared/constants';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'path';

async function waitForSnapshots(paths: string[], seconds: number = 60) {
  const retries = Math.floor((seconds * 1000) / 200);
  for (let i = 0; i < retries; i++) {
    if (paths.every((p) => existsSync(resolve(__dirname, p)))) {
      if (i > 1) console.info(`Snapshots found after ${i} retries`);
      return;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Snapshots not available after ${retries} retries`);
}

function lazyLoadSnapshot(path: string): Record<string, string> {
  const content = readFileSync(resolve(__dirname, path), 'utf-8');
  const lines = content
    .split('\n')
    .filter((l) => l.startsWith('exports[`'))
    .map((l) => {
      const match = l.match(/exports\[`(.+?)`] = (.+)/);
      if (!match) return null;
      const [, key, val] = match;
      return [key, eval(val as string)];
    })
    .filter(Boolean) as [string, string][];
  return Object.fromEntries(lines);
}

describe('Decode Consistency Between Node and Browser', () => {
  it('should have identical decoded pixel data in server vs browser', async () => {
    await waitForSnapshots([
      './browser/__snapshots__/pixelift.test.ts.snap',
      './server/__snapshots__/pixelift.test.ts.snap'
    ]);

    const browserSnaps = lazyLoadSnapshot('./browser/__snapshots__/pixelift.test.ts.snap');
    const serverSnaps = lazyLoadSnapshot('./server/__snapshots__/pixelift.test.ts.snap');

    for (const format of VERIFIED_INPUT_FORMATS) {
      const key = `decode-consistency > should decode ${format} identically across environments`;

      const browserHash = browserSnaps[key];
      const serverHash = serverSnaps[key];

      expect(browserHash).toEqual(serverHash);
    }
  }, 0);
}, 0);
