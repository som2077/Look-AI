import { getErrorMessage } from "@/shared/api/errors";
import { useOnboardingState } from "@/features/onboarding/model/onboarding-store";
import { showToast } from "@/shared/ui/toast-store";
import { uploadToCloudinary } from "@/shared/cloudinary/client";
import { useSupabase } from "@/shared/supabase/use-supabase";
import {
  fetchSupabaseRows,
  invalidateSupabaseCache,
} from "@/shared/supabase/use-supabase-query";
import { useAuth } from "@clerk/clerk-expo";
import { useCallback, useEffect, useRef, useState } from "react";
import { create } from "zustand";

export interface CommunityPost {
  id: string;
  user_id: string;
  image_url: string;
  caption: string;
  likes_count: number;
  created_at: string;
  user_profiles?: {
    nickname: string;
    username: string;
    user_id?: string;
    avatar_url?: string;
  };
}

interface CommunityPostsStore {
  posts: CommunityPost[];
  setPosts: (posts: CommunityPost[]) => void;
  addPost: (post: CommunityPost) => void;
  appendPosts: (posts: CommunityPost[]) => void;
}

const DUMMY_POSTS: CommunityPost[] = [];

// Fixed page size for feed pagination. The range offset is NOT part of the
// query cache key, so each page must carry its own cacheKeySuffix to avoid
// pages overwriting each other in the module cache.
const PAGE_SIZE = 50;

const usePostsStore = create<CommunityPostsStore>((set) => ({
  posts: DUMMY_POSTS,
  setPosts: (posts) => set({ posts }),
  addPost: (post) => set((state) => ({ posts: [...state.posts, post] })),
  appendPosts: (posts) =>
    set((state) => {
      const existingIds = new Set(state.posts.map((p) => p.id));
      const fresh = posts.filter((p) => !existingIds.has(p.id));
      return { posts: [...state.posts, ...fresh] };
    }),
}));

const removeOptimisticPosts = () => {
  usePostsStore.setState((state) => ({
    posts: state.posts.filter((post) => !post.id.includes("0.")),
  }));
};

export function useCommunityPosts() {
  const posts = usePostsStore((s) => s.posts);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);
  const [uploading, setUploading] = useState(false);
  const { userId } = useAuth(); // Assuming the Supabase user_id matches Clerk
  const { supabase, isInitializing } = useSupabase();

  const fetchPosts = useCallback(
    async (force = false, nextPage = 0) => {
      if (isInitializing || !supabase) return;
      try {
        const backendPosts = await fetchSupabaseRows<any>({
          supabase,
          table: "community_posts",
          select: `
          id, user_id, image_url, caption, likes_count, created_at,
          user_profiles (
            nickname,
            username,
            user_id,
            avatar_url
          ),
          post_reactions(user_id, reaction_type),
          comments_count:post_comments(count),
          recent_comments:post_comments(id, user_profiles(avatar_url, username))
        `,
          userId,
          force,
          // Short TTL: feed changes often — the cache mainly coalesces the 3
          // screens that mount this hook (explore / post / user) into one call.
          // Page-scoped suffix so page N doesn't clobber page 0 in the cache.
          ttlMs: 15_000,
          cacheKeySuffix: `feed:page:${nextPage}`,
          apply: (q) =>
            q
              .order("created_at", { ascending: false })
              .range(nextPage * PAGE_SIZE, nextPage * PAGE_SIZE + PAGE_SIZE - 1)
              .limit(4, { foreignTable: 'recent_comments' }),
        });

        const localMockPosts = usePostsStore
          .getState()
          .posts.filter((p) => p.id.includes("0."));

        if (nextPage === 0) {
          if (localMockPosts.length > 0 && backendPosts.length > 0) {
            removeOptimisticPosts();
          }
          usePostsStore.getState().setPosts(backendPosts.length > 0 ? backendPosts : DUMMY_POSTS);
        } else {
          usePostsStore.getState().appendPosts(backendPosts);
        }

        // A short page (< PAGE_SIZE) means we've hit the end of the feed.
        setHasMore(backendPosts.length === PAGE_SIZE);

        if (userId) {
          const likes = await fetchSupabaseRows<{ post_id: string }>({
            supabase,
            table: "post_likes",
            select: "post_id",
            cacheKeySuffix: "own",
            userId,
            apply: (q) => q.eq("user_id", userId as string),
          });
          setLikedPostIds(new Set(likes.map((l) => l.post_id)));
        }
      } catch (err) {
        console.error("Error fetching community posts:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [supabase, isInitializing, userId],
  );

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || isInitializing || !supabase) return;
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    setLoadingMore(true);
    return fetchPosts(false, nextPage);
  }, [loadingMore, hasMore, isInitializing, supabase, fetchPosts]);

  const refetch = useCallback(() => {
    pageRef.current = 0;
    return fetchPosts(true, 0);
  }, [fetchPosts]);

  useEffect(() => {
    if (isInitializing || !supabase) return;

    // Realtime intentionally NOT used for the public feed: a single post event
    // would fan out to every subscribed client (10k-way amplification). Feed
    // freshness comes from pull-to-refresh + post-create refresh instead.
    void fetchPosts();
  }, [supabase, isInitializing, fetchPosts]);

  const toggleLike = async (postId: string) => {
    if (!userId) throw new Error("You must be logged in to like.");
    if (!supabase) throw new Error("Supabase client not initialized.");

    const isLiked = likedPostIds.has(postId);

    try {
      // Optimistic UI Update
      setLikedPostIds((prev) => {
        const next = new Set(prev);
        if (isLiked) {
          next.delete(postId);
        } else {
          next.add(postId);
        }
        return next;
      });

      if (isLiked) {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .match({ post_id: postId, user_id: userId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: userId });
        if (error) throw error;
      }

      // Cached "my likes" set is now stale — bust it so the next feed fetch is correct.
      invalidateSupabaseCache("post_likes", userId);
    } catch (err) {
      console.error("Error toggling like:", err);
      setLikedPostIds((prev) => {
        const next = new Set(prev);
        if (isLiked) {
          next.add(postId);
        } else {
          next.delete(postId);
        }
        return next;
      });
      showToast("error", getErrorMessage(err));
    }
  };

  const toggleReaction = useCallback(
    async (postId: string, reactionType: string) => {
      if (!userId || !supabase) return;

      const previousPosts = usePostsStore.getState().posts;
      let isAdding = true;

      // Optimistic UI Update
      usePostsStore.setState((state) => ({
        posts: state.posts.map((post) => {
          if (post.id === postId) {
            const currentReactions = (post as any).post_reactions || [];
            const hasReaction = currentReactions.some(
              (r: any) =>
                r.user_id === userId && r.reaction_type === reactionType,
            );

            isAdding = !hasReaction;

            let newReactions;
            if (isAdding) {
              newReactions = [
                ...currentReactions,
                { user_id: userId, reaction_type: reactionType },
              ];
            } else {
              newReactions = currentReactions.filter(
                (r: any) =>
                  !(r.user_id === userId && r.reaction_type === reactionType),
              );
            }
            return { ...post, post_reactions: newReactions };
          }
          return post;
        }),
      }));

      try {
        if (isAdding) {
          const { error } = await supabase.from("post_reactions").insert({
            post_id: postId,
            user_id: userId,
            reaction_type: reactionType,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("post_reactions")
            .delete()
            .match({
              post_id: postId,
              user_id: userId,
              reaction_type: reactionType,
            });
          if (error) throw error;
        }
      } catch (err) {
        console.error("Error toggling reaction:", err);
        // Rollback on error
        usePostsStore.setState({ posts: previousPosts });
        showToast("error", getErrorMessage(err));
      }
    },
    [supabase, userId],
  );

  const addComment = useCallback(
    async (postId: string, content: string) => {
      if (!userId || !supabase) return false;

      try {
        const { error } = await supabase.from("post_comments").insert({
          post_id: postId,
          user_id: userId,
          content: content,
        });
        if (error) throw error;
        return true;
      } catch (err) {
        console.error("Error adding comment:", err);
        showToast("error", getErrorMessage(err));
        return false;
      }
    },
    [supabase, userId],
  );

  // Comments are intentionally NOT in the feed select (keeps the feed slim).
  // Fetch them per-post on demand when the replies sheet opens.
  const fetchComments = useCallback(
    async (postId: string): Promise<any[]> => {
      if (!supabase) return [];
      try {
        const { data, error } = await supabase
          .from("post_comments")
          .select("*, user_profiles(nickname, username, avatar_url)")
          .eq("post_id", postId)
          .order("created_at", { ascending: true });
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error("Error fetching comments:", err);
        return [];
      }
    },
    [supabase],
  );

  const createPost = async (imageUri: string, caption: string) => {
    setUploading(true);
    const { nickname, username } = useOnboardingState.getState();
    const newPost: CommunityPost = {
      id: Math.random().toString(),
      user_id: userId || "mock_user",
      image_url: imageUri,
      caption: caption,
      likes_count: 0,
      created_at: new Date().toISOString(),
      user_profiles: {
        nickname: nickname || "You",
        username: username || "you",
        user_id: userId || undefined,
      },
    };

    try {
      usePostsStore.getState().addPost(newPost);

      if (!userId || !supabase) {
        console.warn("Missing auth or supabase, skipping backend upload");
        return true;
      }

      let cloudinaryUrl = null;
      if (imageUri) {
        cloudinaryUrl = await uploadToCloudinary(imageUri);
        if (!cloudinaryUrl) {
          throw new Error("Image upload failed. Please try again.");
        }
      }

      const { error } = await supabase.from("community_posts").insert({
        user_id: userId,
        image_url: cloudinaryUrl,
        caption: caption,
      });

      if (error) throw error;

      removeOptimisticPosts();
      pageRef.current = 0;
      await fetchPosts(true, 0); // Force-refresh page 0: don't rely on Realtime (feed is pull-to-refresh now)
      return true;
    } catch (err) {
      console.error("Error creating post:", err);
      usePostsStore.setState((state) => ({
        posts: state.posts.filter((post) => post.id !== newPost.id),
      }));
      showToast("error", getErrorMessage(err));
      return false;
    } finally {
      setUploading(false);
    }
  };

  const deletePost = useCallback(
    async (postId: string) => {
      if (!userId || !supabase) return false;

      // Optimistically update the UI
      const previousPosts = usePostsStore.getState().posts;
      usePostsStore.setState((state) => ({
        posts: state.posts.filter((post) => post.id !== postId),
      }));

      try {
        const { error } = await supabase
          .from("community_posts")
          .delete()
          .match({ id: postId, user_id: userId });

        if (error) throw error;
        return true;
      } catch (err) {
        console.error("Error deleting post:", err);
        usePostsStore.setState({ posts: previousPosts });
        showToast("error", getErrorMessage(err));
        return false;
      }
    },
    [userId, supabase],
  );

  return {
    posts,
    likedPostIds,
    loading,
    loadingMore,
    hasMore,
    uploading,
    createPost,
    deletePost,
    toggleLike,
    toggleReaction,
    addComment,
    fetchComments,
    refetch,
    loadMore,
  };
}
