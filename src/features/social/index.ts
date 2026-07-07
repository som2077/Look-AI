// ─── Social — Public API ──────────────────────────────────────────────────────
// Import from this file when consuming social from outside the feature.
// Do NOT import directly from internal subfolders.

// Model
export * from "./model/social-store";

// API hooks
export { useCommunityPosts } from "./api/useCommunityPosts";
export type { CommunityPost } from "./api/useCommunityPosts";

export { useGroupPosts } from "./api/useGroupPosts";
export type { GroupPost } from "./api/useGroupPosts";

export { useGroups } from "./api/useGroups";

// UI
export { TrendFeed } from "./ui/TrendFeed";
