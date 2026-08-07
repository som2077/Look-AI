// ─── Shopping — Public API ────────────────────────────────────────────────────
// Import from this file when consuming shopping from outside the feature.
// Do NOT import directly from internal subfolders.

export { useAffiliateProducts } from "./api/useAffiliateProducts";
export type { AffiliateProduct } from "./api/useAffiliateProducts";

export { useSheinProducts } from "./api/useSheinProducts";
export type { SheinProduct } from "./api/useSheinProducts";
