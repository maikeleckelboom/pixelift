export function snapshotTestCaseKey(format?: string): string {
  const message = 'consistent hash from URL across runs and environments' as const;
  return format ? `${format}: ${message}` : message;
}
