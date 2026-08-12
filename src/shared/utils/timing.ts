// ─── Timing utilities — debounce / throttle ───────────────────────────────────
// Pure functions, no React deps. Use directly in stores / event handlers or via
// the hooks in src/shared/hooks (useDebounce / useThrottle).

type AnyFn = (...args: any[]) => void;

/**
 * Returns a debounced version of `fn`: the call is delayed until `ms` ms have
 * passed without another invocation. Returns a cancel function.
 */
export function debounce<T extends AnyFn>(fn: T, ms = 300): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn(...args);
    }, ms);
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return Object.assign(debounced, { cancel }) as T & { cancel: () => void };
}

/**
 * Returns a throttled version of `fn`: at most one call per `ms` window.
 * Leading-edge by default (fires immediately, then suppresses until the window
 * passes). Returns a cancel function.
 */
export function throttle<T extends AnyFn>(fn: T, ms = 300): T & { cancel: () => void } {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = ms - (now - lastCall);

    if (remaining <= 0) {
      lastCall = now;
      fn(...args);
      return;
    }

    if (timeoutId) return;
    timeoutId = setTimeout(() => {
      timeoutId = null;
      lastCall = Date.now();
      fn(...args);
    }, remaining);
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return Object.assign(throttled, { cancel }) as T & { cancel: () => void };
}
