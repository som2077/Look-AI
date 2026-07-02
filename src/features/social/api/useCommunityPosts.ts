import { useAuth } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { uploadToCloudinary } from "@/shared/api-client/cloudinary";
import { useSupabase } from "@/shared/api-client/useSupabase";

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

interface CommunityPostsStore {
  posts: CommunityPost[];
  hasFetched: boolean;
  setPosts: (posts: CommunityPost[]) => void;
  addPost: (post: CommunityPost) => void;
  setHasFetched: (val: boolean) => void;
}

const DUMMY_POSTS: CommunityPost[] = [
  {
    id: "dummy_1",
    user_id: "user1",
    image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80",
    caption: "Loving this new summer fit! ☀️",
    likes_count: 124,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    user_profiles: { nickname: "Sarah", username: "sarah_style" },
  },
  {
    id: "dummy_2",
    user_id: "user2",
    image_url: "https://images.unsplash.com/photo-1550614000-4b95d415d1a5?w=800&q=80",
    caption: "Minimalist street style for the weekend.",
    likes_count: 89,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    user_profiles: { nickname: "Alex", username: "alex_fits" },
  },
  {
    id: "dummy_3",
    user_id: "user3",
    image_url: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80",
    caption: "Cozy knits are back in season.",
    likes_count: 210,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    user_profiles: { nickname: "Emily", username: "em_styles" },
  },
  {
    id: "dummy_4",
    user_id: "user4",
    image_url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80",
    caption: "Shopping day downtown! 🛍️",
    likes_count: 345,
    created_at: new Date(Date.now() - 90000000).toISOString(),
    user_profiles: { nickname: "Jessica", username: "jess_fashion" },
  },
  {
    id: "dummy_5",
    user_id: "user5",
    image_url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&q=80",
    caption: "Vintage vibes today ✨",
    likes_count: 156,
    created_at: new Date(Date.now() - 100000000).toISOString(),
    user_profiles: { nickname: "Mike", username: "mike_vintage" },
  },
  {
    id: "dummy_6",
    user_id: "user6",
    image_url: "https://images.unsplash.com/photo-1485230405346-71acb9518d9c?w=800&q=80",
    caption: "Oversized coats and coffee ☕",
    likes_count: 420,
    created_at: new Date(Date.now() - 110000000).toISOString(),
    user_profiles: { nickname: "Chloe", username: "chloe_daily" },
  },
  {
    id: "dummy_7",
    user_id: "user7",
    image_url: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&q=80",
    caption: "Ready for the evening party 🎉",
    likes_count: 890,
    created_at: new Date(Date.now() - 120000000).toISOString(),
    user_profiles: { nickname: "Liam", username: "liam_looks" },
  },
  {
    id: "dummy_8",
    user_id: "user8",
    image_url: "https://images.unsplash.com/photo-1492447166138-50c3889fccb1?w=800&q=80",
    caption: "Casual Fridays.",
    likes_count: 234,
    created_at: new Date(Date.now() - 130000000).toISOString(),
    user_profiles: { nickname: "Noah", username: "noah_menswear" },
  },
  {
    id: "dummy_9",
    user_id: "user9",
    image_url: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=800&q=80",
    caption: "Accessories make the outfit 💍",
    likes_count: 567,
    created_at: new Date(Date.now() - 140000000).toISOString(),
    user_profiles: { nickname: "Mia", username: "mia_accessories" },
  },
  {
    id: "dummy_10",
    user_id: "user10",
    image_url: "https://images.unsplash.com/photo-1509631179647-0c37cb1100f8?w=800&q=80",
    caption: "Autumn colors 🍂",
    likes_count: 312,
    created_at: new Date(Date.now() - 150000000).toISOString(),
    user_profiles: { nickname: "Emma", username: "emma_fall" },
  }
];

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
          user_profiles:user_id (
            nickname,
            username
          )
        `,
        )
        .order("created_at", { ascending: false });

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

      const cloudinaryUrl = await uploadToCloudinary(imageUri);

      if (!cloudinaryUrl) {
        throw new Error("Image upload failed. Please try again.");
      }

      const { error } = await supabase.from("community_posts").insert({
        user_id: profile.id,
        image_url: cloudinaryUrl,
        caption: caption,
      });

      if (error) throw error;

      removeOptimisticPosts();
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
    refetch: fetchPosts,
  };
}
