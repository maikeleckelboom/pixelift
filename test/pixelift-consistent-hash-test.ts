import { expect, test } from 'vitest';
import {
  LOSSLESS_TEST_FORMATS,
  makeSnapshotKey,
  SNAPSHOT_FIXTURE_FILENAME
} from './fixtures/constants';
import { existsSync } from 'fs';
import { resolve } from 'path';

async function waitForSnapshots(paths: string[], timeoutSec = 30) {
  const intervalMs = 200;
  const retries = Math.ceil((timeoutSec * 1000) / intervalMs);
  for (let i = 0; i < retries; i++) {
    if (paths.every((p) => existsSync(resolve(__dirname, p)))) {
      if (i > 1) console.info(`Snapshots found after ${i} retries.`);
      return;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Snapshots not available after ${timeoutSec}s`);
}

async function loadSnap(path: string) {
  const mod = await import(path);
  const content = mod.default ?? mod;
  return Object.fromEntries(Object.entries(content).map(([k, v]) => [k, String(v)]));
}

test('consistent hash test', async () => {
  await waitForSnapshots([
    `./browser/__snapshots__/${SNAPSHOT_FIXTURE_FILENAME}.snap`,
    `./server/__snapshots__/${SNAPSHOT_FIXTURE_FILENAME}.snap`
  ]);

  const browserSnaps = await loadSnap(
    `./browser/__snapshots__/${SNAPSHOT_FIXTURE_FILENAME}.snap`
  );
  const serverSnaps = await loadSnap(
    `./server/__snapshots__/${SNAPSHOT_FIXTURE_FILENAME}.snap`
  );

  for (const [i, format] of LOSSLESS_TEST_FORMATS.entries()) {
    const key = makeSnapshotKey(format, i + 1);
    expect(browserSnaps[key]).toBeDefined();
    expect(serverSnaps[key]).toBeDefined();
    expect(browserSnaps[key]).toEqual(serverSnaps[key]);
  }
}, 0);
