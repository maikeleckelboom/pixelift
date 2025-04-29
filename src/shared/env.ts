import { repository, version } from '../../package.json';

export function getVersion(): string {
  return version;
}

export function getRepositoryUrl(): string {
  const url = repository.url;
  const startIndex = url.startsWith('git+') ? 4 : 0;
  const endIndex = url.endsWith('.git') ? url.length - 4 : url.length;
  return startIndex === 0 && endIndex === url.length ? url : url.substring(startIndex, endIndex);
}

export function isServer(): boolean {
  // 1. Build-time check for bundle environments
  if (typeof process !== 'undefined' && process.versions?.vite != null) {
    return true;
  }
  // 2. Node.js runtime
  if (typeof process !== 'undefined' && process.versions?.node != null) {
    return true;
  }
  // 3. Browser main-thread
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return false;
  }
  // 4. Browser Web Worker
  return !(typeof self !== 'undefined' && typeof window === 'undefined');
}
