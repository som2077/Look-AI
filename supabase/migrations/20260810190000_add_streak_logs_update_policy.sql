-- Add an UPDATE policy to streak_logs so upserts on an existing
-- (user_id, activity_date) row don't get blocked by RLS.
-- Without this, useLogAppOpen / useStreakSync's
-- .upsert(..., { onConflict: "user_id,activity_date" }) returns 403
-- when the row already exists (today's app-open already logged).

create policy "streak_logs_update_own"
  on public.streak_logs
  for update
  to public
  using ((auth.jwt() ->> 'sub'::text) = user_id)
  with check ((auth.jwt() ->> 'sub'::text) = user_id);
