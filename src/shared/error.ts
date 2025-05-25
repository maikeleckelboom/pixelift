export function throwIfAborted(signal?: AbortSignal): void {
    if (signal?.aborted) {
        // Prefer native DOMException if available (Node 20+ and browsers)
        if (typeof DOMException === 'function') {
            throw new DOMException('Aborted', 'AbortError');
        } else {
            // Fallback for environments without DOMException
            const error = new Error('Aborted');
            error.name = 'AbortError';
            throw error;
        }
    }
}
