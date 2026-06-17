import { useAuth } from "@clerk/clerk-expo";
import { useEffect, useRef, useState } from "react";
import { createSupabaseClient } from "@/backend/api/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export const useSupabase = () => {
  const { isLoaded, isSignedIn, getToken, userId } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const clientRef = useRef<SupabaseClient>(createSupabaseClient());
  const [supabase, setSupabase] = useState<SupabaseClient>(
    () => clientRef.current,
  );
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initClient = async () => {
      if (!isLoaded) {
        return;
      }

      setIsInitializing(true);

      try {
        const getSupabaseToken = isSignedIn
          ? () => getTokenRef.current({ template: "supabase" })
          : undefined;

        if (!isMounted) {
          return;
        }

        const newClient = createSupabaseClient(getSupabaseToken);
        clientRef.current = newClient;
        setSupabase(newClient);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.warn(
          "Failed to initialize Supabase client with Clerk token",
          error,
        );
        const fallback = createSupabaseClient();
        clientRef.current = fallback;
        setSupabase(fallback);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    void initClient();

    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn, userId]);

  return { supabase, isInitializing };
};
