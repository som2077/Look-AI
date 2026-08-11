import { usePendingBatchStore } from "@/features/wardrobe/model/usePendingBatchStore";

import { useOutfitAnalysisStore } from "./outfit-analysis-store";

/**
 * True when there is any active outfit work the home screen should surface:
 * an in-progress analysis, previously completed outfits, or a pending batch scan.
 *
 * Centralizes the show/hide predicate that several home-screen banners used to
 * re-implement independently (NotifyBanner, EmptyStyleBanner, AddClothesCTA).
 */
export function useHasOutfitActivity(): boolean {
  const isAnalyzing = useOutfitAnalysisStore((s) => s.isAnalyzing);
  const lastOutfits = useOutfitAnalysisStore((s) => s.lastOutfits);
  const pendingBatchItems = usePendingBatchStore((s) => s.items);

  return isAnalyzing || (lastOutfits?.length ?? 0) > 0 || pendingBatchItems.length > 0;
}
