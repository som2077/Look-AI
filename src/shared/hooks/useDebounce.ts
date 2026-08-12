import { useEffect, useState } from "react";

/**
 * Returns `value`, but only updated after `ms` ms of no changes. Use for
 * search-as-you-type inputs so keystrokes don't fire a request each render.
 */
export function useDebouncedValue<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timeoutId);
  }, [value, ms]);

  return debounced;
}
