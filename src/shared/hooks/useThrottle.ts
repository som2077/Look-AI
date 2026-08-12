import { useMemo, useRef } from "react";
import { throttle } from "@/shared/utils/timing";

/**
 * Memoized throttled callback — at most one invocation per `ms` window.
 * Useful for scroll handlers, submit guards, and pull-to-refresh debouncing.
 * The returned callback is stable across renders and always calls the latest
 * `fn`; `cancel()` drops any pending trailing call.
 */
export function useThrottledCallback<T extends (...args: any[]) => void>(
  fn: T,
  ms = 300,
): T & { cancel: () => void } {
  // Keep the latest fn without rebinding the throttle (stable across renders).
  const fnRef = useRef(fn);
  fnRef.current = fn;

  return useMemo(
    () => throttle((...args: Parameters<T>) => fnRef.current(...args), ms),
    [ms],
  ) as T & { cancel: () => void };
}
