/**
 * useAiUsage — fetches the per-feature AI usage summary for the
 * "AI Usage" section in the user profile.
 *
 * Calls the get_ai_usage_summary() RPC. Uses a small module-level cache
 * (30s TTL) so re-renders within the same session don't re-fetch.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useSupabase } from "@/shared/supabase/use-supabase";
import { useAuth } from "@clerk/clerk-expo";
import type { AiFeatureKey } from "@/shared/telemetry/ai-usage";

export interface AiUsageSummary {
  feature_key: AiFeatureKey;
  feature_label: string;
  total_count: number;
  this_month_count: number;
  last_month_count: number;
  last_used_at: string | null;
}

const CACHE_TTL_MS = 30_000;

interface CacheEntry {
  data: AiUsageSummary[];
  timestamp: number;
  userId: string;
}
const summaryCache = new Map<string, CacheEntry>();

export interface UseAiUsageResult {
  data: AiUsageSummary[];
  loading: boolean;
  error: Error | null;
  refetch: (force?: boolean) => Promise<void>;
}

export function useAiUsage(): UseAiUsageResult {
  const { supabase, isInitializing } = useSupabase();
  const { userId, isLoaded } = useAuth();
  const cacheKey = userId ? `${userId}::ai_usage_summary` : "anon::ai_usage_summary";

  const [data, setData] = useState<AiUsageSummary[]>(() => {
    const cached = summaryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    const cached = summaryCache.get(cacheKey);
    return !(cached && Date.now() - cached.timestamp < CACHE_TTL_MS);
  });
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);

  const fetchData = useCallback(
    async (force = false) => {
      if (!isLoaded || isInitializing) return;
      if (!userId || !supabase) {
        setLoading(false);
        return;
      }

      if (!force) {
        const cached = summaryCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
          setData(cached.data);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);
      try {
        const { data: rows, error: rpcError } = await supabase.rpc(
          "get_ai_usage_summary",
        );
        if (rpcError) throw rpcError;
        const safeRows = (rows ?? []) as AiUsageSummary[];
        summaryCache.set(cacheKey, {
          data: safeRows,
          timestamp: Date.now(),
          userId,
        });
        if (isMounted.current) {
          setData(safeRows);
        }
      } catch (err) {
        if (isMounted.current) {
          setError(
            err instanceof Error
              ? err
              : new Error("Failed to load AI usage"),
          );
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    },
    [cacheKey, isInitializing, isLoaded, supabase, userId],
  );

  useEffect(() => {
    isMounted.current = true;
    void fetchData();
    return () => {
      isMounted.current = false;
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: (force?: boolean) => fetchData(Boolean(force)),
  };
}

/** Drop the cached summary (call after a tracked usage event). */
export function invalidateAiUsageCache(userId: string) {
  summaryCache.delete(`${userId}::ai_usage_summary`);
}
