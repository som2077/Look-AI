import { useAuth } from "@clerk/clerk-expo";
import { useEffect, useRef, useState } from "react";
import { create } from "zustand";
import { debounce } from "@/shared/utils/timing";
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
  const notifications = useNotificationsStore((s) => s.notifications);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
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

      useNotificationsStore.getState().setNotifications(items);
      useNotificationsStore.getState().setUnreadCount(items.filter((item) => !item.is_read).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Keep the debounced refetch reading the latest fetchNotifications without
  // rebinding the timer on every render.
  const fetchRef = useRef(fetchNotifications);
  fetchRef.current = fetchNotifications;
  const debouncedRefetch = useRef(debounce(() => void fetchRef.current(), 1000));

  useEffect(() => {
    if (isInitializing || !supabase || !userId) return;

    void fetchNotifications();

    // Singleton channel: explore + notifications screens share ONE subscription.
    // Realtime bursts are coalesced with the shared 1s debounce (the old inline
    // setTimeout did the same job; this uses the common utility + cancel).
    // Capture the ref value so handler + cleanup share the same debounced fn.
    const debouncedFetch = debouncedRefetch.current;
    const unsubscribe = subscribeToTable(supabase, {
      table: "notifications",
      userId,
      filter: `user_id=eq.${userId}`,
      handler: () => {
        debouncedFetch();
      },
    });

    return () => {
      debouncedFetch.cancel();
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, isInitializing, userId]);

  const markAllAsRead = async () => {
    if (!supabase || !userId || unreadCount === 0) return;
    
    // Optimistic UI update
    useNotificationsStore.getState().setUnreadCount(0);
    useNotificationsStore.getState().setNotifications(
      useNotificationsStore.getState().notifications.map(n => ({ ...n, is_read: true }))
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
