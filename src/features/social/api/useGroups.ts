import { useUser } from "@clerk/clerk-expo";
import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "@/shared/supabase/use-supabase";

export interface Group {
  id: string;
  name: string;
  members_count: number;
  description: string;
  image: string;
  color: string;
  avatars?: string[];
}

export function useGroups() {
  const { supabase, isInitializing } = useSupabase();
  const { user } = useUser();
  const [groups, setGroups] = useState<Group[]>([]);
  const [joinedGroupIds, setJoinedGroupIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (isInitializing || !user) return;
    try {
      // Fetch all groups
      const { data: allGroups, error: groupsError } = await supabase
        .from("groups")
        .select("*")
        .order("members_count", { ascending: false });

      if (groupsError) throw groupsError;
      setGroups(allGroups || []);

      // Fetch user's joined groups
      const { data: memberData, error: memberError } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (memberError) throw memberError;
      setJoinedGroupIds(memberData?.map((m) => m.group_id) || []);
    } catch (err) {
      console.error("Error fetching groups:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, isInitializing, user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const joinGroup = async (groupId: string) => {
    if (!user) return;
    if (joinedGroupIds.includes(groupId)) return;

    setJoinedGroupIds((prev) =>
      prev.includes(groupId) ? prev : [...prev, groupId],
    );
    try {
      const { error } = await supabase.from("group_members").insert({
        group_id: groupId,
        user_id: user.id,
      });
      if (error) throw error;
    } catch (e) {
      console.error("Error joining group:", e);
      setJoinedGroupIds((prev) => prev.filter((id) => id !== groupId));
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;
    if (!joinedGroupIds.includes(groupId)) return;

    setJoinedGroupIds((prev) => prev.filter((id) => id !== groupId));
    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user.id);
      if (error) throw error;
    } catch (e) {
      console.error("Error leaving group:", e);
      setJoinedGroupIds((prev) =>
        prev.includes(groupId) ? prev : [...prev, groupId],
      );
    }
  };

  return {
    groups,
    joinedGroupIds,
    loading,
    joinGroup,
    leaveGroup,
    refresh: fetchGroups,
  };
}
