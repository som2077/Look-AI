// Build a user-scoped Supabase client for an edge function.
//
// RLS is enforced by the JWT we pass in, so every query is automatically
// filtered to the caller's user_id. We never need to add a `WHERE user_id=…`
// clause ourselves. The `persistSession: false` flag stops the client from
// trying to refresh the token, which would fail inside a serverless runtime.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

export function createUserClient(
  supabaseUrl: string,
  supabaseAnonKey: string,
  bearerToken: string,
) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${bearerToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
