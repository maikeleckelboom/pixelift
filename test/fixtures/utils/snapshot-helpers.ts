import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { makeSnapshotKey } from '../constants';

export enum Environment {
  BROWSER = 'browser',
  SERVER = 'server'
}

const SNAPSHOT_DIRS = {
  [Environment.BROWSER]: 'browser/__snapshots__',
  [Environment.SERVER]: 'server/__snapshots__'
} as const;

// Snapshot file handling utilities
export function getSnapshotPath(environment: Environment, fileName: string): string {
  // __dirname in this file is deep in the directory structure, so we need to go up to project root
  // and then navigate to the snapshot directories from there
  const projectRoot = resolve(__dirname, '../../../');
  return resolve(projectRoot, 'test', SNAPSHOT_DIRS[environment], fileName);
}

export async function waitForSnapshots(paths: string[], timeoutSec = 30): Promise<void> {
  const intervalMs = 200;
  const retries = Math.ceil((timeoutSec * 1000) / intervalMs);

  for (let attempt = 1; attempt <= retries; attempt++) {
    if (paths.every((p) => existsSync(p))) {
      if (attempt > 1) {
        console.info(`Snapshots found after ${attempt} attempts`);
      }
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Snapshots not available after ${timeoutSec}s (${paths.join(', ')})`);
}

export function loadSnapshotFile(path: string): Record<string, string> {
  try {
    const content = readFileSync(path, 'utf8');
    return parseSnapshotContent(content);
  } catch (error) {
    console.error(`Error loading snapshot file ${path}:`, error);
    return {};
  }
}

// Key generation utilities
export function createSnapshotKey(options: {
  environment: Environment;
  format: string;
  caseNumber: number;
}): string {
  const testTitle = `[${options.environment}] ${options.format} | case ${options.caseNumber}`;
  const snapshotName = makeSnapshotKey(options.format, options.caseNumber);
  return `${testTitle} > ${snapshotName} 1`; // Vitest appends " 1" to snapshot names
}

// Snapshot content parser
const VITEST_SNAPSHOT_REGEX = /exports\[(["'`])(.*?)\1]\s*=\s*(["'`])(.*?)\3;/gs;

function parseSnapshotContent(content: string): Record<string, string> {
  const snapshots: Record<string, string> = {};
  let match: RegExpExecArray | null;

  while ((match = VITEST_SNAPSHOT_REGEX.exec(content)) !== null) {
    const [, , key, , value] = match;
    snapshots[key as string] = value as string;
  }

  return snapshots;
}
