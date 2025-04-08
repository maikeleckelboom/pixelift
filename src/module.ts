import { ErrorCode, ModuleError } from './core';

/**
 * Safely imports a module and handles resolution errors
 * @param module
 */
export async function safeImport<T>(module: string): Promise<T> {
  try {
    return await import(module);
  } catch (error) {
    throw createModuleResolutionError(module);
  }
}

/**
 * Standardized error factory for module resolution failures
 */
export function createModuleResolutionError(moduleName: string): ModuleError {
  return new ModuleError(
    `Module '${moduleName}' is not installed or not resolvable. Please ensure the module is installed and available in your environment.`,
    ErrorCode.MISSING_DEPENDENCY,
  );
}
