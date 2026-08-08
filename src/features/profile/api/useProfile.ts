import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/supabase/client';
import { useAuth } from '@clerk/clerk-expo';

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
  bio: string;
  about: string;
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
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      setData(data as UserProfile | null);
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
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
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

