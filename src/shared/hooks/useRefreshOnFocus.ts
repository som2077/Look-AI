import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";

/**
 * Call `refetch` (cache-busting) whenever the screen regains focus, but never
 * more than once per `minIntervalMs` — prevents duplicate fetches when screens
 * stack (e.g. wardrobe → details → back). Pass a stable `refetch` from
 * useCallback or a hook that already memoizes it.
 */
export function useRefreshOnFocus(
  refetch: (force?: boolean) => void | Promise<void>,
  { minIntervalMs = 5_000, force = true }: { minIntervalMs?: number; force?: boolean } = {},
) {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;
  const lastRunAt = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastRunAt.current < minIntervalMs) return;

      lastRunAt.current = now;
      void refetchRef.current(force);
      // Intentionally no cleanup: we don't want to cancel an in-flight refetch
      // when the screen blurs.
      return undefined;
    }, [minIntervalMs, force]),
  );
}
