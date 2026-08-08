import { useState, useCallback } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useSupabase } from "@/shared/supabase/use-supabase";
import {
  deleteFromCloudinary,
  extractPublicIdFromUrl,
} from "@/features/scanning/api/cloudinary-upload";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  resetAllUserStores,
  syncStoresWithUser,
} from "@/shared/storage/namespacedStorage";
import { useCalendarPlanStore } from "@/features/calendar/model/calendar-plan-store";
import Purchases from "react-native-purchases";

export function useDeleteAccount() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { supabase } = useSupabase();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteAccount = useCallback(async () => {
    if (!user) {
      throw new Error("No authenticated user found.");
    }

    const userId = user.id;
    setIsDeleting(true);
    setError(null);

    try {
      // ─────────────────────────────────────────────────────────────
      // STAGE 1: Collect All User Media Asset URLs
      // ─────────────────────────────────────────────────────────────
      const cloudinaryUrls: string[] = [];

      // 1.1 Wardrobe Items
      try {
        const { data: wardrobeItems } = await supabase
          .from("wardrobe_items")
          .select("image_url, original_image_url")
          .eq("user_id", userId);

        if (wardrobeItems) {
          for (const item of wardrobeItems) {
            if (item.image_url) cloudinaryUrls.push(item.image_url);
            if (item.original_image_url) {
              cloudinaryUrls.push(item.original_image_url);
            }
          }
        }
      } catch (err) {
        console.warn("Could not query wardrobe_items images:", err);
      }

      // 1.2 Saved Care Labels
      try {
        const { data: savedLabels } = await supabase
          .from("saved_labels")
          .select("image_url")
          .eq("user_id", userId);

        if (savedLabels) {
          for (const label of savedLabels) {
            if (label.image_url) cloudinaryUrls.push(label.image_url);
          }
        }
      } catch (err) {
        console.warn("Could not query saved_labels images:", err);
      }

      // 1.3 Fit Check Analyses
      try {
        const { data: fitChecks } = await supabase
          .from("fit_check_analyses")
          .select("image_url")
          .eq("user_id", userId);

        if (fitChecks) {
          for (const fc of fitChecks) {
            if (fc.image_url) cloudinaryUrls.push(fc.image_url);
          }
        }
      } catch (err) {
        console.warn("Could not query fit_check_analyses images:", err);
      }

      // 1.4 Virtual Try-On Generations
      try {
        const { data: tryOns } = await supabase
          .from("virtual_try_on_generations")
          .select("garment_image_url, model_image_url, result_image_url")
          .eq("user_id", userId);

        if (tryOns) {
          for (const t of tryOns) {
            if (t.garment_image_url) cloudinaryUrls.push(t.garment_image_url);
            if (t.model_image_url) cloudinaryUrls.push(t.model_image_url);
            if (t.result_image_url) cloudinaryUrls.push(t.result_image_url);
          }
        }
      } catch (err) {
        console.warn("Could not query virtual_try_on_generations images:", err);
      }

      // 1.5 Community Posts
      try {
        const { data: communityPosts } = await supabase
          .from("community_posts")
          .select("image_url")
          .eq("user_id", userId);

        if (communityPosts) {
          for (const post of communityPosts) {
            if (post.image_url) cloudinaryUrls.push(post.image_url);
          }
        }
      } catch (err) {
        console.warn("Could not query community_posts images:", err);
      }

      // 1.6 Logged Outfits
      try {
        const { data: loggedOutfits } = await supabase
          .from("logged_outfits")
          .select("image_url")
          .eq("user_id", userId);

        if (loggedOutfits) {
          for (const outfit of loggedOutfits) {
            if (outfit.image_url) cloudinaryUrls.push(outfit.image_url);
          }
        }
      } catch (err) {
        console.warn("Could not query logged_outfits images:", err);
      }

      // 1.7 User Profile (Avatar & Full-length photos)
      try {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("avatar_url, full_length_photos")
          .eq("user_id", userId)
          .single();

        if (profile?.avatar_url) {
          cloudinaryUrls.push(profile.avatar_url);
        }
        if (Array.isArray(profile?.full_length_photos)) {
          for (const photoUrl of profile.full_length_photos) {
            if (photoUrl) cloudinaryUrls.push(photoUrl);
          }
        }
      } catch (err) {
        console.warn("Could not query user_profiles avatar/photos:", err);
      }

      // ─────────────────────────────────────────────────────────────
      // STAGE 2: Delete Remote Media (Cloudinary & Supabase Storage)
      // ─────────────────────────────────────────────────────────────
      const publicIds = Array.from(
        new Set(
          cloudinaryUrls
            .map((url) => extractPublicIdFromUrl(url))
            .filter((id): id is string => Boolean(id)),
        ),
      );

      // Cloudinary deletion (resilient Promise.allSettled)
      if (publicIds.length > 0) {
        await Promise.allSettled(
          publicIds.map((id) => deleteFromCloudinary(id)),
        );
      }

      // Supabase Storage Buckets
      const buckets = ["full-length-pics", "try-on-uploads"];
      for (const bucket of buckets) {
        try {
          const { data: files } = await supabase.storage
            .from(bucket)
            .list(userId);

          if (files && files.length > 0) {
            const filePaths = files.map((file) => `${userId}/${file.name}`);
            await supabase.storage.from(bucket).remove(filePaths);
          }
        } catch (storageErr) {
          console.warn(`Could not clean storage bucket ${bucket}:`, storageErr);
        }
      }

      // ─────────────────────────────────────────────────────────────
      // STAGE 3: Delete Supabase Database Records (in dependency order)
      // ─────────────────────────────────────────────────────────────
      const userTables = [
        "post_comments",
        "post_saves",
        "post_reactions",
        "post_likes",
        "community_posts",
        "notifications",
        "planned_events",
        "streak_logs",
        "user_gamification",
        "ai_recommendations",
        "saved_labels",
        "virtual_try_on_generations",
        "fit_check_analyses",
        "wear_logs",
        "logged_outfits",
        "wardrobe_items",
        "user_profiles",
      ];

      for (const table of userTables) {
        try {
          await supabase.from(table).delete().eq("user_id", userId);
        } catch (tableErr) {
          console.warn(`Error deleting from ${table}:`, tableErr);
        }
      }

      // Clean notifications where user was actor
      try {
        await supabase.from("notifications").delete().eq("actor_id", userId);
      } catch (notifErr) {
        console.warn("Error deleting notifications with actor_id:", notifErr);
      }

      // ─────────────────────────────────────────────────────────────
      // STAGE 4: Local Device Data & State Purge
      // ─────────────────────────────────────────────────────────────
      try {
        // Reset Zustand stores
        resetAllUserStores();
        useCalendarPlanStore.getState().setPlannedOutfit(null);
        await syncStoresWithUser(null);

        // Delete all AsyncStorage keys belonging to this user or unprefixed store cache
        const allKeys = await AsyncStorage.getAllKeys();
        const userKeys = allKeys.filter(
          (key) =>
            key.startsWith(`${userId}_`) ||
            key === "user-wardrobe-store" ||
            key === "useStreakStore" ||
            key === "social-store" ||
            key === "scan-history-store" ||
            key === "user-outfits-store" ||
            key === "outfit-analysis-store" ||
            key === "lookai-onboarding-store" ||
            key === "notifications_enabled" ||
            key === "fcm_token",
        );

        if (userKeys.length > 0) {
          await AsyncStorage.multiRemove(userKeys);
        }
      } catch (localErr) {
        console.warn("Error cleaning local storage:", localErr);
      }

      // Purchases logOut
      try {
        await Purchases.logOut();
      } catch (purchasesErr) {
        // RevenueCat logout might fail if user is anonymous or not configured, safe to ignore
        console.warn("Purchases logOut warning:", purchasesErr);
      }

      // ─────────────────────────────────────────────────────────────
      // STAGE 5: Clerk User Account Deletion & Session Cleanup
      // ─────────────────────────────────────────────────────────────
      try {
        await user.delete();
      } catch (clerkErr: any) {
        console.warn("Clerk user.delete() error, attempting signOut:", clerkErr);
        await signOut();
        throw clerkErr;
      }
    } catch (err: any) {
      console.error("Account deletion failed:", err);
      const msg = err?.message || "Failed to delete account";
      setError(msg);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [user, signOut, supabase]);

  return { deleteAccount, isDeleting, error };
}
