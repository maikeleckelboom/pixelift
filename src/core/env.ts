declare global {
  interface Window {
    __VITE_SSR?: boolean;
  }

  interface ImportMetaEnv {
    SSR?: boolean;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

/**
 * Checks if the current environment is Node.js (including Vite SSR).
 */
export function isNode() {
  // Prioritize Vite SSR check
  if (typeof import.meta !== 'undefined' && import.meta.env.SSR) {
    return true;
  }
  // Fallback for Node.js environments
  return typeof process !== 'undefined' &&
    process.versions?.node !== undefined &&
    typeof window === 'undefined';
}

/**
 * Checks if the current environment is a browser.
 */
export function isBrowser() {
  // Prioritize Vite SSR check
  if (typeof import.meta !== 'undefined' && import.meta.env.SSR) {
    return false;
  }
  // Fallback for browser environments
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}