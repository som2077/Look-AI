import { useAuth } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { uploadToCloudinary } from "@/shared/cloudinary/client";
import { useSupabase } from "@/shared/supabase/use-supabase";

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
  hasFetched: boolean;
  setPosts: (posts: CommunityPost[]) => void;
  addPost: (post: CommunityPost) => void;
  setHasFetched: (val: boolean) => void;
}

const DUMMY_POSTS: CommunityPost[] = [];

const usePostsStore = create<CommunityPostsStore>((set) => ({
  posts: DUMMY_POSTS,
  hasFetched: false,
  setPosts: (posts) => set({ posts }),
  addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
  setHasFetched: (val) => set({ hasFetched: val }),
}));

const removeOptimisticPosts = () => {
  usePostsStore.setState((state) => ({
    posts: state.posts.filter((post) => !post.id.includes("0.")),
  }));
};

export function useCommunityPosts() {
  const { posts, setPosts, addPost, hasFetched, setHasFetched } =
    usePostsStore();
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { userId } = useAuth(); // Assuming the Supabase user_id matches Clerk
  const { supabase, isInitializing } = useSupabase();

  const fetchPosts = async () => {
    if (isInitializing || !supabase) return;
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select(
          `
          *,
          user_profiles (
            nickname,
            username,
            user_id,
            avatar_url
          ),
          post_reactions(user_id, reaction_type)
        `,
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const backendPosts = (data ?? []) as any[];
      const localMockPosts = usePostsStore
        .getState()
        .posts.filter((p) => p.id.includes("0."));

      if (localMockPosts.length > 0 && backendPosts.length > 0) {
        removeOptimisticPosts();
      }

      setPosts(backendPosts.length > 0 ? backendPosts : DUMMY_POSTS);

      if (userId) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (profile) {
          const { data: likes } = await supabase
            .from("post_likes")
            .select("post_id")
            .eq("user_id", profile.id);

          if (likes) {
            setLikedPostIds(new Set(likes.map((l: any) => l.post_id)));
          }
        }
      }
    } catch (err) {
      console.error("Error fetching community posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitializing || !supabase) return;

    if (!hasFetched) {
      fetchPosts();
      setHasFetched(true);
    }

    let timeoutId: any;

    const subscription = supabase
      .channel("public:community_posts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_posts" },
        () => {
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            fetchPosts(); // Refresh posts safely after bursts
          }, 2000);
        },
      )
      .subscribe();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      supabase.removeChannel(subscription);
    };
  }, [supabase, isInitializing, userId, hasFetched]);

  const toggleLike = async (postId: string) => {
    if (!userId) throw new Error("You must be logged in to like.");
    if (!supabase) throw new Error("Supabase client not initialized.");

    try {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!profile) return;

      const isLiked = likedPostIds.has(postId);

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
          .match({ post_id: postId, user_id: profile.id });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: profile.id });
        if (error) throw error;
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      setLikedPostIds((prev) => {
        const next = new Set(prev);
        if (likedPostIds.has(postId)) {
          next.add(postId);
        } else {
          next.delete(postId);
        }
        return next;
      });
    }
  };

  const toggleReaction = async (postId: string, reactionType: string | null) => {
    if (!userId || !supabase) return;
    try {
      if (reactionType === null) {
        const { error } = await supabase
          .from("post_reactions")
          .delete()
          .match({ post_id: postId, user_id: userId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("post_reactions")
          .upsert({ post_id: postId, user_id: userId, reaction_type: reactionType }, { onConflict: 'post_id,user_id' });
        if (error) throw error;
      }
      await fetchPosts();
    } catch (err) {
      console.error("Error toggling reaction:", err);
    }
  };

  const createPost = async (imageUri: string, caption: string) => {
    setUploading(true);
    const newPost: CommunityPost = {
      id: Math.random().toString(),
      user_id: userId || "mock_user",
      image_url: imageUri,
      caption: caption,
      likes_count: 0,
      created_at: new Date().toISOString(),
      user_profiles: {
        nickname: "You",
        username: "you",
        user_id: userId || undefined,
      },
    };

    try {
      addPost(newPost);

      if (!userId || !supabase) {
        console.warn("Missing auth or supabase, skipping backend upload");
        return true;
      }

      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (profileError || !profile) {
        console.warn("Profile not found, keeping local only");
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
        user_id: profile.id,
        image_url: cloudinaryUrl,
        caption: caption,
      });

      if (error) throw error;

      removeOptimisticPosts();
      await fetchPosts(); // Explicitly fetch posts so we don't rely solely on Realtime being enabled
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

  return {
    posts,
    likedPostIds,
    loading,
    uploading,
    createPost,
    toggleLike,
    toggleReaction,
    refetch: fetchPosts,
  };
}
