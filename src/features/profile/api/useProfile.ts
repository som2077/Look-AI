import { supabase } from "@/shared/supabase/client";
import {
  fetchSupabaseRows,
  invalidateSupabaseCache,
} from "@/shared/supabase/use-supabase-query";
import { useAuth } from "@clerk/clerk-expo";
import { useCallback, useEffect, useState } from "react";

export type UserProfile = {
  user_id: string;
  nickname: string;
  username: string;
  age: number;
  height: number;
  gender: string;
  body_type: string;
  style_preferences: string[];
  avatar_url: string;
};

export function useUserProfile() {
  const { userId } = useAuth();
  const [data, setData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // Explicit columns (no select("*")) + shared 30s cache. A missing row is
      // an empty list here, which avoids the PGRST116 special-case entirely.
      const rows = await fetchSupabaseRows<UserProfile>({
        supabase,
        table: "user_profiles",
        select:
          "user_id, nickname, username, age, height, gender, body_type, style_preferences, avatar_url",
        userId,
        apply: (q) => q.eq("user_id", userId).limit(1),
      });
      setData(rows[0] ?? null);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { data, isLoading, error, refetch: fetchProfile };
}

export function useUpdateProfile() {
  const { userId } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userId) throw new Error("No user found");

    setIsUpdating(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      invalidateSupabaseCache("user_profiles", userId);
      return data;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateProfile, isUpdating, error };
}
