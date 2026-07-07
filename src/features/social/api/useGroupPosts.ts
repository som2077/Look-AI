import { useUser } from "@clerk/clerk-expo";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSupabase } from "@/shared/supabase/use-supabase";

export interface GroupPost {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  // Merged profile info
  username?: string;
  avatar?: string;
  // Reactions mapping emoji -> count
  reactions?: Record<string, number>;
  myReaction?: string | null;
}



export function useGroupPosts(groupId: string) {
  const { supabase, isInitializing } = useSupabase();
  const { user } = useUser();
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchPosts = useCallback(async () => {
    if (isInitializing || !groupId) return;
    try {
      // 1. Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from("group_posts")
        .select(
          `
          id, group_id, user_id, content, created_at
        `,
        )
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      // 2. Fetch reactions
      const postIds = postsData?.map((p) => p.id) || [];
      let reactionsData: any[] = [];
      if (postIds.length > 0) {
        const { data: rx, error: rxError } = await supabase
          .from("group_post_reactions")
          .select("*")
          .in("post_id", postIds);
        if (!rxError) reactionsData = rx || [];
      }

      // 3. Fetch user profiles for avatars/usernames
      // First get unique user IDs from posts
      const userIds = Array.from(
        new Set(postsData?.map((p) => p.user_id) || []),
      );
      let profiles: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profs, error: profError } = await supabase
          .from("user_profiles")
          .select("user_id, nickname")
          .in("user_id", userIds);

        if (!profError && profs) {
          profs.forEach((p) => {
            profiles[p.user_id] = { username: p.nickname };
          });
        }
      }

      // 4. Assemble data
      const assembled: GroupPost[] = (postsData || []).map((post) => {
        const postReactions = reactionsData.filter(
          (r) => r.post_id === post.id,
        );
        const reactionsCount: Record<string, number> = {};
        let myReaction: string | null = null;

        postReactions.forEach((r) => {
          reactionsCount[r.emoji] = (reactionsCount[r.emoji] || 0) + 1;
          if (user && r.user_id === user.id) {
            myReaction = r.emoji;
          }
        });

        return {
          ...post,
          username:
            profiles[post.user_id]?.username ||
            "user_" + post.user_id.slice(0, 4),
          // Fallback avatar since user_profiles doesn't store avatar URL yet
          avatar: `https://ui-avatars.com/api/?name=${profiles[post.user_id]?.username || "User"}`,
          reactions: reactionsCount,
          myReaction,
        };
      });

      setPosts(assembled);
    } catch (e) {
      console.error("Error fetching group posts:", e);
    } finally {
      setLoading(false);
    }
  }, [supabase, isInitializing, groupId, user]);

  useEffect(() => {
    fetchPosts();

    if (!isInitializing && groupId) {
      const channel = supabase
        .channel(`public:group_posts:${groupId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "group_posts",
            filter: `group_id=eq.${groupId}`,
          },
          (payload) => {
            fetchPosts(); // For MVP simplicity, refetch all to get profiles/reactions
          },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "group_post_reactions" },
          (payload) => {
            fetchPosts();
          },
        )
        .subscribe();

      channelRef.current = channel;

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [supabase, isInitializing, groupId, fetchPosts]);

  const addPost = async (content: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("group_posts").insert({
        group_id: groupId,
        user_id: user.id,
        content,
      });
      if (error) throw error;
    } catch (e) {
      console.error("Error adding post:", e);
    }
  };

  const toggleReaction = async (postId: string, emoji: string) => {
    if (!user) return;

    // Find if user already reacted
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    try {
      if (post.myReaction === emoji) {
        // Remove reaction
        const { error } = await supabase
          .from("group_post_reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .eq("emoji", emoji);
        if (error) throw error;
      } else {
        // If reacted with different emoji, delete old
        if (post.myReaction) {
          const { error } = await supabase
            .from("group_post_reactions")
            .delete()
            .eq("post_id", postId)
            .eq("user_id", user.id);
          if (error) throw error;
        }
        // Insert new reaction
        const { error } = await supabase.from("group_post_reactions").insert({
          post_id: postId,
          user_id: user.id,
          emoji,
        });
        if (error) throw error;
      }
    } catch (e) {
      console.error("Error toggling reaction:", e);
    }
  };

  return { posts, loading, addPost, toggleReaction };
}
