import { useState, useEffect } from "react";
import { useSupabase } from "./useSupabase";
import { uploadToCloudinary } from "../api/cloudinary";
import { useAuth } from "@clerk/clerk-expo";

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
  };
}

export function useCommunityPosts() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
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
          user_profiles:user_id (
            nickname,
            username
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data as any);

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
    fetchPosts();

    const subscription = supabase
      .channel("public:community_posts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_posts" },
        () => {
          fetchPosts(); // Refresh posts when likes_count changes or new post is added
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [supabase, isInitializing, userId]);

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
        await supabase
          .from("post_likes")
          .delete()
          .match({ post_id: postId, user_id: profile.id });
      } else {
        await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: profile.id });
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      // Optional: Revert optimistic update here
    }
  };

  const createPost = async (imageUri: string, caption: string) => {
    if (!userId) throw new Error("You must be logged in to post.");
    if (!supabase) throw new Error("Supabase client not initialized.");

    setUploading(true);
    try {
      // First get the user's UUID from user_profiles table using their Clerk ID
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (profileError || !profile) {
        throw new Error(
          "User profile not found. Please complete onboarding first.",
        );
      }

      // 1. Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(imageUri);

      // 2. Save to Supabase using the UUID
      const { error } = await supabase.from("community_posts").insert({
        user_id: profile.id,
        image_url: cloudinaryUrl,
        caption: caption,
      });

      if (error) throw error;

      return true;
    } catch (err) {
      console.error("Error creating post:", err);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { posts, likedPostIds, loading, uploading, createPost, toggleLike, refetch: fetchPosts };
}
