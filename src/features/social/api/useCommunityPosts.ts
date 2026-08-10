import { useOnboardingState } from "@/features/onboarding/model/onboarding-store";
import { uploadToCloudinary } from "@/shared/cloudinary/client";
import { useSupabase } from "@/shared/supabase/use-supabase";
import {
  fetchSupabaseRows,
  invalidateSupabaseCache,
} from "@/shared/supabase/use-supabase-query";
import { useAuth } from "@clerk/clerk-expo";
import { useCallback, useEffect, useState } from "react";
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
}

const DUMMY_POSTS: CommunityPost[] = [];

const usePostsStore = create<CommunityPostsStore>((set) => ({
  posts: DUMMY_POSTS,
  setPosts: (posts) => set({ posts }),
  addPost: (post) => set((state) => ({ posts: [...state.posts, post] })),
}));

const removeOptimisticPosts = () => {
  usePostsStore.setState((state) => ({
    posts: state.posts.filter((post) => !post.id.includes("0.")),
  }));
};

export function useCommunityPosts() {
  const { posts, setPosts, addPost } = usePostsStore();
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { userId } = useAuth(); // Assuming the Supabase user_id matches Clerk
  const { supabase, isInitializing } = useSupabase();

  const fetchPosts = useCallback(
    async (force = false) => {
      if (isInitializing || !supabase) return;
      try {
        const backendPosts = await fetchSupabaseRows<any>({
          supabase,
          table: "community_posts",
          select: `
          *,
          user_profiles (
            nickname,
            username,
            user_id,
            avatar_url
          ),
          post_reactions(user_id, reaction_type)
        `,
          userId,
          force,
          // Short TTL: feed changes often — the cache mainly coalesces the 3
          // screens that mount this hook (explore / post / user) into one call.
          ttlMs: 15_000,
          apply: (q) =>
            q.order("created_at", { ascending: false }).range(0, 49),
        });

        const localMockPosts = usePostsStore
          .getState()
          .posts.filter((p) => p.id.includes("0."));

        if (localMockPosts.length > 0 && backendPosts.length > 0) {
          removeOptimisticPosts();
        }

        setPosts(backendPosts.length > 0 ? backendPosts : DUMMY_POSTS);

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
      }
    },
    [supabase, isInitializing, userId, setPosts],
  );

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
    }
  };

  const toggleReaction = useCallback(async (postId: string, reactionType: string) => {
    if (!userId || !supabase) return;

    const previousPosts = usePostsStore.getState().posts;
    let isAdding = true;

    // Optimistic UI Update
    usePostsStore.setState((state) => ({
      posts: state.posts.map((post) => {
        if (post.id === postId) {
          const currentReactions = (post as any).post_reactions || [];
          const hasReaction = currentReactions.some(
            (r: any) => r.user_id === userId && r.reaction_type === reactionType
          );

          isAdding = !hasReaction;

          let newReactions;
          if (isAdding) {
            newReactions = [...currentReactions, { user_id: userId, reaction_type: reactionType }];
          } else {
            newReactions = currentReactions.filter(
              (r: any) => !(r.user_id === userId && r.reaction_type === reactionType)
            );
          }
          return { ...post, post_reactions: newReactions };
        }
        return post;
      }),
    }));

    try {
      if (isAdding) {
        const { error } = await supabase
          .from("post_reactions")
          .insert({
            post_id: postId,
            user_id: userId,
            reaction_type: reactionType,
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("post_reactions")
          .delete()
          .match({ post_id: postId, user_id: userId, reaction_type: reactionType });
        if (error) throw error;
      }
    } catch (err) {
      console.error("Error toggling reaction:", err);
      // Rollback on error
      usePostsStore.setState({ posts: previousPosts });
    }
  }, [supabase, userId]);

  const addComment = useCallback(async (postId: string, content: string) => {
    if (!userId || !supabase) return false;

    const previousPosts = usePostsStore.getState().posts;
    const { nickname, username } = useOnboardingState.getState();

    // Optimistic UI Update
    const newComment = {
      id: Math.random().toString(),
      content: content,
      created_at: new Date().toISOString(),
      user_profiles: {
        nickname: nickname || "You",
        username: username || "you",
      },
    };

    usePostsStore.setState((state) => ({
      posts: state.posts.map((post) => {
        if (post.id === postId) {
          const currentComments = (post as any).post_comments || [];
          return { ...post, post_comments: [...currentComments, newComment] };
        }
        return post;
      }),
    }));

    try {
      const { error } = await supabase
        .from("post_comments")
        .insert({
          post_id: postId,
          user_id: userId,
          content: content,
        });
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Error adding comment:", err);
      // Rollback on error
      usePostsStore.setState({ posts: previousPosts });
      return false;
    }
  }, [supabase, userId]);

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
      addPost(newPost);

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
      await fetchPosts(true); // Force-refresh: don't rely on Realtime (feed is pull-to-refresh now)
      return true;
    } catch (err) {
      console.error("Error creating post:", err);
      usePostsStore.setState((state) => ({
        posts: state.posts.filter((post) => post.id !== newPost.id),
      }));
      return false;
    } finally {
      setUploading(false);
    }
  };

  const deletePost = useCallback(async (postId: string) => {
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
      return false;
    }
  }, [userId, supabase]);

  return {
    posts,
    likedPostIds,
    loading,
    uploading,
    createPost,
    deletePost,
    toggleLike,
    toggleReaction,
    addComment,
    refetch: () => fetchPosts(true),
  };
}
