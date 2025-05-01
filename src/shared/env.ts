export function isServer(): boolean {
  // Check for explicit browser environment
  if (typeof window !== 'undefined' || typeof self !== 'undefined') {
    return false;
  }
  // Node.js or server-side runtime
  return typeof process !== 'undefined' && !!process.versions?.node;
}
