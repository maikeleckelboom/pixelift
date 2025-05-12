export function createSnapshotTestCaseKey(format?: string): string {
  return format
    ? `${format}: consistent hash from URL across runs and environments`
    : 'consistent hash from URL across runs and environments';
}
