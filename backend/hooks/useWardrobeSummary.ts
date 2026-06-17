import { useMemo } from "react";
import { useSupabaseQuery } from "./useSupabaseQuery";

export interface WardrobeSummary {
  readonly periodLabel: string;
  readonly wornPercentage: number;
  readonly totalWorn: number;
  readonly wearCount: number;
  readonly neverCount: number;
}

interface WardrobeSummaryRow extends Record<string, unknown> {
  readonly user_id: string;
  readonly period?: string | null;
  readonly period_label?: string | null;
  readonly worn_percentage?: number | null;
  readonly total_worn?: number | null;
  readonly wear_count?: number | null;
  readonly never_count?: number | null;
}

const TABLE_NAME = "wardrobe_summary" as const;

export const DEFAULT_WARDROBE_SUMMARY: WardrobeSummary = {
  periodLabel: "Weekly",
  wornPercentage: 0,
  totalWorn: 0,
  wearCount: 0,
  neverCount: 0,
};

export const useWardrobeSummary = (
  userId?: string | null,
  period: string = "weekly",
) => {
  const hasUserId = Boolean(userId);

  const { data, loading, error } = useSupabaseQuery<WardrobeSummaryRow>(
    TABLE_NAME,
    {
      select:
        "user_id, period, period_label, worn_percentage, total_worn, wear_count, never_count",
      enabled: hasUserId,
      cacheKeySuffix: hasUserId ? `${userId}:${period}` : undefined,
      apply: (query) => {
        if (!userId) {
          return query;
        }

        return query.eq("user_id", userId).eq("period", period).limit(1);
      },
    },
  );

  const summary = useMemo<WardrobeSummary>(() => {
    if (!hasUserId) {
      return DEFAULT_WARDROBE_SUMMARY;
    }

    const row = data[0];

    if (!row) {
      return {
        ...DEFAULT_WARDROBE_SUMMARY,
        periodLabel: formatPeriodLabel(period),
      };
    }

    return {
      periodLabel: row.period_label ?? formatPeriodLabel(row.period ?? period),
      wornPercentage: normalizeRatio(row.worn_percentage),
      totalWorn: coerceNonNegative(row.total_worn),
      wearCount: coerceNonNegative(row.wear_count),
      neverCount: coerceNonNegative(row.never_count),
    };
  }, [data, hasUserId, period]);

  return {
    summary,
    loading: hasUserId ? loading : false,
    error: hasUserId ? error : null,
  };
};

const formatPeriodLabel = (value?: string | null): string => {
  if (!value) return "This period";

  switch (value.toLowerCase()) {
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    case "yearly":
      return "Yearly";
    default:
      return value.charAt(0).toUpperCase() + value.slice(1);
  }
};

const normalizeRatio = (value?: number | null): number => {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
    return 0;
  }

  if (value <= 1) {
    return value;
  }

  if (value <= 100) {
    return value / 100;
  }

  return 1;
};

const coerceNonNegative = (value?: number | null): number => {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
};
