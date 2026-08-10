import { useAuth } from "@clerk/clerk-expo";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { useErrorStore } from "../ui/ErrorStateView";
import { useSupabase } from "./use-supabase";

type QueryBuilder = ReturnType<
  ReturnType<
    ReturnType<typeof import("@supabase/supabase-js").createClient>["from"]
  >["select"]
>;

type UseSupabaseQueryOptions = {
  select?: string;
  apply?: (query: QueryBuilder) => QueryBuilder;
  enabled?: boolean;
  /** Distinguishes filtered queries in the cache (e.g. userId + period). */
  cacheKeySuffix?: string;
  /** Overrides the default 30s cache TTL (ms). */
  ttlMs?: number;
};

// ── Module-level cache + in-flight dedup (survives screen unmounts) ──────────
const CACHE_TTL_MS = 30_000;
interface CacheEntry<T> {
  data: T[];
  timestamp: number;
}
const queryCache = new Map<string, CacheEntry<Record<string, unknown>>>();
const inFlight = new Map<string, Promise<Record<string, unknown>[]>>();

export function getCacheKey(
  table: string,
  select?: string,
  suffix?: string,
  userId?: string | null,
): string {
  const scopedUserId = userId ?? "anonymous";
  const base = `${scopedUserId}::${table}::${select ?? "*"}`;
  return suffix ? `${base}::${suffix}` : base;
}

export interface FetchRowsOptions {
  supabase: SupabaseClient;
  table: string;
  select?: string;
  apply?: (query: QueryBuilder) => QueryBuilder;
  cacheKeySuffix?: string;
  userId?: string | null;
  /** Skip the fresh-cache read but still write the result back (force refresh). */
  force?: boolean;
  ttlMs?: number;
}

/**
 * Deduped + cached row fetch. Identical concurrent queries share ONE network
 * call; fresh results are served from the 30s module cache. Safe to call from
 * hooks AND plain zustand stores / event handlers — this is the single fetch
 * path for hot list reads.
 */
export async function fetchSupabaseRows<T extends Record<string, unknown>>(
  opts: FetchRowsOptions,
): Promise<T[]> {
  const key = getCacheKey(
    opts.table,
    opts.select,
    opts.cacheKeySuffix,
    opts.userId,
  );
  const ttl = opts.ttlMs ?? CACHE_TTL_MS;

  if (!opts.force) {
    const cached = queryCache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data as T[];
    }

    // Coalesce identical in-flight requests into one network call.
    const pending = inFlight.get(key);
    if (pending) {
      try {
        return (await pending) as T[];
      } catch {
        // shared request failed — fall through to a fresh attempt
      }
    }
  }

  const promise = (async () => {
    let query = opts.supabase.from(opts.table).select(opts.select ?? "*");
    if (opts.apply) query = opts.apply(query);
    const { data, error } = await query;
    if (error) throw error;
    const rows = (data ?? []) as unknown as Record<string, unknown>[];
    queryCache.set(key, { data: rows, timestamp: Date.now() });
    return rows;
  })();

  inFlight.set(key, promise);
  try {
    return (await promise) as T[];
  } finally {
    inFlight.delete(key);
  }
}

/** Drop cached rows for a table (optionally scoped to a user + suffix). */
export function invalidateSupabaseCache(
  table: string,
  userId?: string | null,
  suffix?: string,
) {
  const prefix = `${userId ?? "anonymous"}::${table}`;
  for (const key of queryCache.keys()) {
    if (
      key.startsWith(prefix) &&
      (suffix === undefined || key.endsWith(suffix))
    ) {
      queryCache.delete(key);
    }
  }
}

export const useSupabaseQuery = <T extends Record<string, unknown>>(
  table: string,
  options?: UseSupabaseQueryOptions,
) => {
  const { supabase, isInitializing } = useSupabase();
  const { userId } = useAuth();
  const enabled = options?.enabled !== false;
  const cacheKey = getCacheKey(
    table,
    options?.select,
    options?.cacheKeySuffix,
    userId,
  );

  // Initialise from cache immediately to avoid flash of empty state
  const [data, setData] = useState<T[]>(() => {
    if (!enabled) return [];
    const cached = queryCache.get(cacheKey);
    if (
      cached &&
      Date.now() - cached.timestamp < (options?.ttlMs ?? CACHE_TTL_MS)
    ) {
      return cached.data as T[];
    }
    return [];
  });
  const [loading, setLoading] = useState(() => (!enabled ? false : true));
  const [error, setError] = useState<PostgrestError | Error | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchData = useCallback(
    async (force?: boolean) => {
      const opts = optionsRef.current;
      const isEnabled = opts?.enabled !== false;

      if (!isEnabled || isInitializing) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const rows = await fetchSupabaseRows<T>({
          supabase,
          table,
          select: opts?.select,
          apply: opts?.apply,
          cacheKeySuffix: opts?.cacheKeySuffix,
          userId,
          force,
          ttlMs: opts?.ttlMs,
        });
        setData(rows);
      } catch (unknownError) {
        const err =
          unknownError instanceof Error
            ? unknownError
            : new Error("Failed to fetch Supabase data.");
        setError(err);

        const msg = err.message.toLowerCase();
        if (
          msg.includes("network request failed") ||
          msg.includes("failed to fetch") ||
          msg.includes("fetch")
        ) {
          useErrorStore.getState().setOffline(true);
        } else {
          useErrorStore.getState().setServerError(true);
        }
      } finally {
        setLoading(false);
      }
    },
    [isInitializing, supabase, table, cacheKey, userId],
  );

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: (force?: boolean) => fetchData(force),
  };
};
