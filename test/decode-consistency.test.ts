import { expect, it } from 'vitest';
import { LOSSLESS_TEST_FORMATS } from './fixtures/constants';
import { existsSync } from 'node:fs';
import { resolve } from 'path';
import { snapshotTestCaseKey } from './fixtures/snapshot-test-case-key';

async function waitForSnapshots(paths: string[], seconds: number = 30) {
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

export async function loadVitestSnapshot(
  relativePath: string
): Promise<Record<string, string>> {
  const fullPath = resolve(__dirname, relativePath);
  const mod = await import(fullPath);
  const exportsObj = mod.default ? mod.default : mod;
  return Object.fromEntries(
    Object.entries(exportsObj).map(([key, val]) => [key, String(val)])
  );
}

it('should have identical decoded pixel data in server vs browser', async () => {
  await waitForSnapshots([
    './browser/__snapshots__/pixelift.test.ts.snap',
    './server/__snapshots__/pixelift.test.ts.snap'
  ]);

  const browserSnaps = await loadVitestSnapshot(
    './browser/__snapshots__/pixelift.test.ts.snap'
  );
  const serverSnaps = await loadVitestSnapshot(
    './server/__snapshots__/pixelift.test.ts.snap'
  );

  for (const format of LOSSLESS_TEST_FORMATS) {
    const key = `${snapshotTestCaseKey(format)} 1`;

    const browserHash = browserSnaps[key];
    const serverHash = serverSnaps[key];

    expect(browserHash).toBeDefined();
    expect(serverHash).toBeDefined();

    expect(browserHash).toEqual(serverHash);
  }
}, 0);
