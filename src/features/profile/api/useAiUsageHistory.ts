/**
 * useAiUsageHistory — paginated history for the per-feature detail screen.
 * Calls the get_ai_usage_history() RPC.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useSupabase } from "@/shared/supabase/use-supabase";
import { useAuth } from "@clerk/clerk-expo";
import type { AiFeatureKey } from "@/shared/telemetry/ai-usage";

export interface AiUsageHistoryRow {
  id: string;
  feature_key: AiFeatureKey;
  feature_label: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface UseAiUsageHistoryResult {
  data: AiUsageHistoryRow[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

const PAGE_SIZE = 50;

export function useAiUsageHistory(
  featureKey: AiFeatureKey | null,
): UseAiUsageHistoryResult {
  const { supabase, isInitializing } = useSupabase();
  const { userId, isLoaded } = useAuth();
  const [data, setData] = useState<AiUsageHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const isMounted = useRef(true);

  const fetchPage = useCallback(
    async (offset: number, append: boolean) => {
      if (!isLoaded || isInitializing || !userId || !supabase) return;

      setLoading(true);
      setError(null);
      try {
        const { data: rows, error: rpcError } = await supabase.rpc(
          "get_ai_usage_history",
          {
            p_feature_key: featureKey,
            p_limit: PAGE_SIZE,
            p_offset: offset,
          },
        );
        if (rpcError) throw rpcError;
        const safeRows = (rows ?? []) as AiUsageHistoryRow[];
        if (isMounted.current) {
          setData((prev) => (append ? [...prev, ...safeRows] : safeRows));
          setHasMore(safeRows.length === PAGE_SIZE);
          offsetRef.current = offset + safeRows.length;
        }
      } catch (err) {
        if (isMounted.current) {
          setError(
            err instanceof Error
              ? err
              : new Error("Failed to load AI usage history"),
          );
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    },
    [featureKey, isInitializing, isLoaded, supabase, userId],
  );

  useEffect(() => {
    isMounted.current = true;
    offsetRef.current = 0;
    setData([]);
    setHasMore(true);
    void fetchPage(0, false);
    return () => {
      isMounted.current = false;
    };
  }, [fetchPage]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore: () => fetchPage(offsetRef.current, true),
    refetch: () => {
      offsetRef.current = 0;
      return fetchPage(0, false);
    },
  };
}
