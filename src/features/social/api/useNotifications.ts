import { useAuth } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { subscribeToTable } from "@/shared/realtime/manager";
import {
  fetchSupabaseRows,
  invalidateSupabaseCache,
} from "@/shared/supabase/use-supabase-query";
import { useSupabase } from "@/shared/supabase/use-supabase";

export interface NotificationItem {
  id: string;
  user_id: string;
  actor_id: string;
  type: string;
  post_id: string;
  reaction_type?: string;
  is_read: boolean;
  created_at: string;
  actor_profile?: {
    nickname: string;
    username: string;
    avatar_url: string;
  };
  community_post?: {
    image_url: string;
    caption: string;
  };
}

interface NotificationsStore {
  notifications: NotificationItem[];
  unreadCount: number;
  setNotifications: (notifications: NotificationItem[]) => void;
  setUnreadCount: (count: number) => void;
}

const useNotificationsStore = create<NotificationsStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
}));

export function useNotifications() {
  const { notifications, unreadCount, setNotifications, setUnreadCount } = useNotificationsStore();
  const [loading, setLoading] = useState(true);
  const { userId } = useAuth();
  const { supabase, isInitializing } = useSupabase();

  const fetchNotifications = async () => {
    if (isInitializing || !supabase || !userId) return;

    try {
      const items = await fetchSupabaseRows<any>({
        supabase,
        table: "notifications",
        select: `
          *,
          actor_profile:user_profiles!actor_id (
            nickname,
            username,
            avatar_url
          ),
          community_post:community_posts!post_id (
            image_url,
            caption
          )
        `,
        cacheKeySuffix: "own",
        userId,
        apply: (q) =>
          q
            .eq("user_id", userId as string)
            .order("created_at", { ascending: false })
            .limit(50),
      });

      setNotifications(items);
      setUnreadCount(items.filter((item) => !item.is_read).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitializing || !supabase || !userId) return;

    void fetchNotifications();

    // Singleton channel: explore + notifications screens share ONE subscription
    let timeoutId: any;
    const unsubscribe = subscribeToTable(supabase, {
      table: "notifications",
      userId,
      filter: `user_id=eq.${userId}`,
      handler: () => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          void fetchNotifications();
        }, 1000);
      },
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, isInitializing, userId]);

  const markAllAsRead = async () => {
    if (!supabase || !userId || unreadCount === 0) return;
    
    // Optimistic UI update
    setUnreadCount(0);
    setNotifications(
      notifications.map(n => ({ ...n, is_read: true }))
    );

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) throw error;

      // Cached list has stale is_read flags — bust it.
      invalidateSupabaseCache("notifications", userId);
    } catch (err) {
      console.error("Error marking notifications as read:", err);
      // rollback could be added here
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
