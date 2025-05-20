import { expect, test } from 'vitest';
import { LOSSLESS_TEST_FORMATS } from './fixtures/constants';
import {
  createSnapshotKey,
  Environment,
  getSnapshotPath,
  loadSnapshotFile,
  waitForSnapshots
} from './fixtures/utils/snapshot-helpers';
import { createError } from '../src/shared/error';

export const TEST_CONFIG = {
  TIMEOUT_SEC: 30,
  POLL_INTERVAL_MS: 200,
  SNAPSHOT_FILE_NAME: 'pixelift.test.ts.snap'
} as const;

test(
  'consistent hash test',
  async () => {
    // Setup snapshot paths
    const snapshotPaths = [
      getSnapshotPath(Environment.BROWSER, TEST_CONFIG.SNAPSHOT_FILE_NAME),
      getSnapshotPath(Environment.SERVER, TEST_CONFIG.SNAPSHOT_FILE_NAME)
    ];

    // Wait for snapshots to be available
    await waitForSnapshots(snapshotPaths, TEST_CONFIG.TIMEOUT_SEC);

    // Load snapshot data
    const [browserSnaps, serverSnaps] = await Promise.all([
      loadSnapshotFile(snapshotPaths[0] as string),
      loadSnapshotFile(snapshotPaths[1] as string)
    ]);

    // Validate snapshot data presence
    validateSnapshotsNotEmpty(browserSnaps, serverSnaps);

    // Perform comparisons for all test formats
    for (const [index, format] of LOSSLESS_TEST_FORMATS.entries()) {
      const caseNumber = index + 1;

      const browserKey = createSnapshotKey({
        environment: Environment.BROWSER,
        format,
        caseNumber
      });

      const serverKey = createSnapshotKey({
        environment: Environment.SERVER,
        format,
        caseNumber
      });

      assertSnapshotEquality({
        browserSnaps,
        serverSnaps,
        browserKey,
        serverKey,
        format,
        caseNumber
      });
    }
  },
  TEST_CONFIG.TIMEOUT_SEC * 1000
);

// Helper functions specific to this test file
function validateSnapshotsNotEmpty(
  browserSnaps: Record<string, string>,
  serverSnaps: Record<string, string>
) {
  if (Object.keys(browserSnaps).length === 0 || Object.keys(serverSnaps).length === 0) {
    throw createError.runtimeError(
      `Missing snapshot data:\n` +
        `Browser snapshots: ${Object.keys(browserSnaps).length}\n` +
        `Server snapshots: ${Object.keys(serverSnaps).length}`
    );
  }
}

function assertSnapshotEquality({
  browserSnaps,
  serverSnaps,
  browserKey,
  serverKey,
  format,
  caseNumber
}: {
  browserSnaps: Record<string, string>;
  serverSnaps: Record<string, string>;
  browserKey: string;
  serverKey: string;
  format: string;
  caseNumber: number;
}) {
  // Verify keys exist in both environments
  expect(
    browserSnaps[browserKey],
    `Missing browser snapshot for ${format} case ${caseNumber}`
  ).toBeDefined();

  expect(
    serverSnaps[serverKey],
    `Missing server snapshot for ${format} case ${caseNumber}`
  ).toBeDefined();

  // Compare actual values
  expect(browserSnaps[browserKey]).toEqual(serverSnaps[serverKey]);
}
