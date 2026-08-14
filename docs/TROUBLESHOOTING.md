# Look AI — Troubleshooting Guide

> **Status:** Living reference · **Last updated:** 2026-08-14

This guide covers common issues, their symptoms, and how to diagnose and fix them. If your issue isn't listed here, check the [GitHub Issues](https://github.com/som2077/Look-AI/issues) or create a new one.

---

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Authentication Issues](#authentication-issues)
- [Supabase / Backend Issues](#supabase--backend-issues)
- [Edge Functions Issues](#edge-functions-issues)
- [Image Pipeline Issues](#image-pipeline-issues)
- [Streaks & Gamification Issues](#streaks--gamification-issues)
- [Build & Deployment Issues](#build--deployment-issues)
- [Runtime / Crash Issues](#runtime--crash-issues)
- [Performance Issues](#performance-issues)
- [State Sync Issues](#state-sync-issues)

---

## Quick Diagnostics

When something goes wrong, follow this checklist first:

```bash
# 1. Check dev server is running
npx expo start --clear

# 2. Check for console errors in the app
#    (Metro bundler terminal shows JS errors)

# 3. Check Supabase connection
#    In the app, try a simple query like fetching your profile

# 4. Check environment variables
cat .env | grep EXPO_PUBLIC_   # Should show all required vars

# 5. Check Sentry for error reports
#    (if Sentry is configured)

# 6. Check network requests
#    Use React Native Debugger or Flipper to inspect HTTP calls
```

**Common error patterns:**

| Error | Likely Category |
|-------|----------------|
| `401 Unauthorized` | Auth / JWT issue |
| `403 Forbidden` | RLS policy blocking access |
| `Network request failed` | Supabase URL/key wrong, or offline |
| `Failed to load module` | Missing dependency or Metro cache issue |
| `Native module cannot be null` | Native module not linked (clean build needed) |
| `Rate limit exceeded` | Edge function rate limiting |
| `Missinganionkey` / `missingprojecturl` | Supabase env vars not set |

---

## Authentication Issues

### Symptom: "Sign in with Google" does nothing or crashes

**Diagnosis:**
1. Check Clerk dashboard → Authentication → Social Connections → Google is enabled
2. Check `.env` has `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` set
3. Check Google OAuth consent screen is configured (for the OAuth app)

**Fix:**
```bash
# Verify Clerk publishable key is set
echo $EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY

# In Clerk dashboard:
# - Ensure Google provider is enabled
# - Ensure the OAuth redirect URI is added to Google Cloud Console
```

### Symptom: Email OTP not delivering

**Diagnosis:**
1. Check Clerk dashboard → Email → Delivery settings
2. Check spam folder on the receiving email
3. Check Clerk rate limits (email OTP has a 30s resend timer)

**Fix:**
- Wait 30 seconds before resending
- Check spam/junk folder
- Verify the email address is correct

### Symptom: "JWT template not found" or Supabase auth errors

**Diagnosis:**
1. In Clerk dashboard, check JWT Templates — there should be a template named `supabase`
2. The template must include the `sub` claim (Clerk user ID)
3. The Supabase client must be configured to use this template

**Fix:**
```typescript
// In src/shared/supabase/client.ts
accessToken: async () => {
  const { getToken } = await Clerk.getAuth();
  return getToken({ template: 'supabase' });  // Template name must match
}
```

### Symptom: User can't access their own data (403)

**Diagnosis:**
1. Check RLS policies — they should use `(auth.jwt() ->> 'sub')::text = user_id::text`
2. The legacy `auth.uid()` based policies throw `ERROR 22P02` for Clerk's text user IDs
3. Verify the JWT being sent includes the `sub` claim

**Fix:**
```sql
-- Correct RLS policy pattern (NOT auth.uid())
CREATE POLICY "Owner SELECT" ON wardrobe_items
  FOR SELECT USING ((auth.jwt() ->> 'sub')::text = user_id::text);
```

---

## Supabase / Backend Issues

### Symptom: "New tables" or "missing column" errors

**Diagnosis:**
1. Check if migrations were pushed to the correct Supabase project
2. Check `supabase/migrations/` for the latest migration files
3. Compare local schema with production using `supabase db diff`

**Fix:**
```bash
# Push migrations to production
supabase db push

# Or check what's missing
supabase db diff --from <migration-version>
```

### Symptom: RLS policies not working as expected

**Diagnosis:**
1. Check the RLS policy matrix in `DATABASE.md` §4
2. Verify the policy is applied: `\d+ <table_name>` in Supabase SQL editor
3. Test with a raw query using the anon key + a valid JWT

**Fix:**
- Recreate the policy with the correct `USING` / `WITH CHECK` expressions
- Make sure `auth.jwt()` is used, not `auth.uid()`

### Symptom: Realtime not working (no updates received)

**Diagnosis:**
1. Check if Realtime is enabled for the table in Supabase dashboard
2. Check if the channel name matches what the app subscribes to
3. Check if the Realtime publication includes the table

**Fix:**
```sql
-- Enable Realtime for a table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE wardrobe_items;

-- Note: community_posts is intentionally NOT added (see ARCHITECTURE.md)
```

### Symptom: `community_posts` feed not updating

**Diagnosis:**
- The community feed was reworked to use pull-to-refresh + pagination instead of Realtime
- Check if the feed query is paginated correctly (`.range(0, 49)`)
- Check if `created_at DESC` index exists

**Fix:**
- Implement pull-to-refresh in the UI
- Verify the pagination logic in the feed query

---

## Edge Functions Issues

### Symptom: Edge function returns 404 or "function not found"

**Diagnosis:**
1. Check if the function is deployed: Supabase dashboard → Functions
2. Check the function name matches what the app calls
3. Check if the function is anon-accessible (or requires auth)

**Fix:**
```bash
# Deploy the function
supabase functions deploy <function-name>

# Test locally
supabase functions serve <function-name>
```

### Symptom: Edge function returns 429 (Rate limit exceeded)

**Diagnosis:**
1. Check the rate limit for the function (see docs/API_EDGE_FUNCTIONS.md)
2. Check if Upstash Redis is configured and reachable
3. Check the `Retry-After` header in the response

**Fix:**
- Wait for the rate limit window to reset (60 seconds)
- If Upstash is unavailable, the rate limiter should fail-open (requests pass through)
- If the function is being called too rapidly, add client-side throttling

### Symptom: Edge function returns 500 (Internal error)

**Diagnosis:**
1. Check Supabase dashboard → Functions → Logs for the function
2. Look for the error message in the logs
3. Common causes: missing env var, API key invalid, upstream API error

**Fix:**
- Set missing secrets: `supabase secrets set <KEY>=<VALUE>`
- Check API keys (Gemini, remove.bg, fal.ai, Cloudinary) are valid
- Reproduce locally with `supabase functions serve`

### Symptom: `virtual-try-on` returns 401

**Diagnosis:**
1. The `virtual-try-on` function has `verify_jwt = true` in `config.toml`
2. The JWT from Clerk must be valid and include the required claims
3. Check that the JWT template in Clerk is correctly configured

**Fix:**
- Verify `verify_jwt = true` is set in `supabase/functions/virtual-try-on/config.toml`
- Ensure the Clerk JWT template includes necessary claims

---

## Image Pipeline Issues

### Symptom: Image upload fails or returns "unsigned upload not allowed"

**Diagnosis:**
1. Cloudinary unsigned uploads are disabled by default on newer accounts
2. The `cloudinary-signature` edge function provides signed upload params
3. Check if the edge function is deployed and accessible

**Fix:**
```bash
# Deploy the signature function
supabase functions deploy cloudinary-signature

# Check the function is reachable
curl https://<project>.supabase.co/functions/v1/cloudinary-signature
```

### Symptom: Background removal fails or returns "invalid API key"

**Diagnosis:**
1. Check `EXPO_PUBLIC_REMOVE_BG_API_KEYS` is set (comma-separated for key rotation)
2. Check if the `remove-bg` edge function is deployed
3. Check remove.bg account has credits available

**Fix:**
```bash
# Set the API keys
supabase secrets set EXPO_PUBLIC_REMOVE_BG_API_KEYS=xxx

# Deploy remove-bg function
supabase functions deploy remove-bg
```

### Symptom: Image not appearing in wardrobe after upload

**Diagnosis:**
1. Check if the Cloudinary URL was stored in the database
2. Check if the image is accessible via the Cloudinary CDN URL
3. Check RLS policies on `wardrobe_items` — the owner should have SELECT access

**Fix:**
- Query `wardrobe_items` directly in Supabase to verify the row exists
- Open the Cloudinary URL in a browser to verify it's accessible
- Check RLS: `(auth.jwt() ->> 'sub')::text = user_id::text`

### Symptom: Storage bucket upload fails (virtual try-on)

**Diagnosis:**
1. Check `try-on-uploads` bucket exists and is public
2. Check bucket policies: authenticated INSERT, public SELECT
3. Check file size (max 10MB) and MIME type (image/* only)

**Fix:**
```sql
-- Verify bucket exists
SELECT * FROM storage.buckets WHERE id = 'try-on-uploads';

-- Check policies
SELECT * FROM storage.policies WHERE bucket_id = 'try-on-uploads';
```

---

## Streaks & Gamification Issues

### Symptom: Streak counter not incrementing

**Diagnosis:**
1. Check if `useStreakSync` is being called on app open
2. Check if `user_gamification` row exists for the user
3. Check if `streak_logs` has today's entry

**Fix:**
- The streak sync runs in `src/app/(root)/_layout.tsx` on app open
- If the `user_gamification` row is missing, it's created automatically on first sync
- Check RLS on `user_gamification` — owner-only

### Symptom: Style score stuck at 0 or 100

**Diagnosis:**
1. The `style_score` default in the applied schema is `0` (not `100` as in old `schema.sql`)
2. Check if the score calculation logic is being triggered
3. Check if `last_logged_date` is being updated

**Fix:**
- Verify the score calculation in `useStreakSync`
- Check that `logged_outfits` entries exist for the user

### Symptom: "Streak freeze" not working

**Diagnosis:**
1. Check `streak_freezes_available` column value
2. Check if the freeze logic is implemented in the streak sync
3. Check if `streak_logs` has the freeze entry

**Fix:**
- The freeze decrement logic should be in the streak sync hook
- Verify `streak_freezes_available` is decremented on use

---

## Build & Deployment Issues

### Symptom: Metro bundler cache issues (stale modules, missing exports)

**Diagnosis:**
1. Metro cache can get corrupted after dependency changes
2. Common after upgrading Expo SDK or adding native modules

**Fix:**
```bash
# Clear Metro cache
npx expo start --clear

# If that doesn't work, clear all caches
rm -rf node_modules/.cache
rm -rf ~/.expo
npm start --clear
```

### Symptom: Native module not found (e.g., "Native module cannot be null")

**Diagnosis:**
1. A native module dependency was added but not recompiled
2. Common with `expo-dev-client` or custom native modules

**Fix:**
```bash
# Prebuild to regenerate native projects
npx expo prebuild --clean

# Rebuild
npx expo run:android
npx expo run:ios
```

### Symptom: EAS build fails with "missing credentials"

**Diagnosis:**
1. EAS doesn't have Apple/Google credentials configured
2. Common on first production build

**Fix:**
```bash
# Interactive credential setup
eas credentials

# Or set up non-interactively
eas build --platform ios --profile production --credentials-managed
```

### Symptom: Build succeeds but app crashes on launch

**Diagnosis:**
1. Check Sentry for the crash report
2. Check if all environment variables are set for the build
3. Check if native modules are properly linked

**Fix:**
- Verify `.env` has all required variables (especially `EXPO_PUBLIC_*` ones)
- Run `npx expo prebuild --clean` and rebuild
- Check Sentry dashboard for the specific crash stack trace

---

## Runtime / Crash Issues

### Symptom: App crashes when opening wardrobe

**Diagnosis:**
1. Check Sentry for the crash report
2. Common cause: masonry layout calculation error or image load failure
3. Check if `MASONRY_HEIGHTS` array is defined

**Fix:**
- Check the wardrobe component in `src/features/wardrobe/components/`
- Verify masonry layout calculations
- Add error boundaries around the wardrobe screen

### Symptom: App crashes on outfit generation

**Diagnosis:**
1. Check if Gemini API key is valid
2. Check if the `gemini-proxy` edge function is deployed and reachable
3. Check if the wardrobe has items to recommend from

**Fix:**
- Verify Gemini API key in environment
- Test `gemini-proxy` function directly: `supabase functions serve gemini-proxy`
- Ensure wardrobe has at least some items

### Symptom: Firebase push notification crash

**Diagnosis:**
1. Check if `@react-native-firebase/messaging` is properly linked
2. Check if `google-services.json` (Android) / `GoogleService-Info.plist` (iOS) is present
3. Check FCM token registration in the app

**Fix:**
- Run `npx expo prebuild --clean` to re-link native modules
- Verify Firebase config files are in the project root
- Check that `fcm_token` is being saved to `user_profiles`

---

## Performance Issues

### Symptom: App feels slow / laggy on wardrobe scroll

**Diagnosis:**
1. Check if images are loading slowly (Cloudinary CDN latency)
2. Check if the masonry layout is recalculating on every render
3. Check if the Supabase query is returning too many items

**Fix:**
- Use `expo-image` with caching for wardrobe images
- Memoize masonry height calculations
- Ensure wardrobe queries are paginated (`.limit(50)` or similar)

### Symptom: High battery drain

**Diagnosis:**
1. Check for unnecessary re-renders (React DevTools Profiler)
2. Check if Realtime channels are open when not needed
3. Check if location services are being polled excessively

**Fix:**
- Optimize render cycles with `React.memo` and `useMemo`
- Close Realtime channels on screen unmount
- Use `expo-location` with appropriate accuracy and interval

### Symptom: Supabase queries are slow

**Diagnosis:**
1. Check if the query is using an index (Supabase dashboard → Database → Inspect)
2. Check if the query is returning too many rows
3. Check if N+1 query patterns are present

**Fix:**
- Add missing indexes (see DATABASE.md §5 for the index list)
- Add `.limit()` to all list queries
- Use the cached fetch layer to reduce duplicate queries

---

## State Sync Issues

### Symptom: Wardrobe changes not reflecting across devices

**Diagnosis:**
1. Check if Realtime is subscribed to `wardrobe_items` for the user
2. Check if the cached fetch layer is serving stale data
3. Check if the query cache TTL (30s) is causing delay

**Fix:**
- Verify Realtime channel is active: check Supabase dashboard → Realtime → Channels
- Pull-to-refresh to bypass cache
- Reduce cache TTL if real-time freshness is critical (but this increases load)

### Symptom: Auth state out of sync (logged in on one screen, logged out on another)

**Diagnosis:**
1. Check if Clerk session is being managed correctly
2. Check if Zustand auth store is persisting correctly
3. Check if the Supabase client is getting a fresh JWT on auth state change

**Fix:**
- Ensure Clerk's `useSession` hook is used consistently
- Verify Zustand persist middleware is saving to `expo-secure-store`
- Call `supabase.auth.refreshSession()` after auth state changes

---

## Getting More Help

If these steps don't resolve your issue:

1. **Check Sentry**: https://sentry.io (if configured) — error reports with stack traces
2. **Check Supabase Logs**: Dashboard → Logs — API and function execution logs
3. **Search existing issues**: https://github.com/som2077/Look-AI/issues
4. **Create a new issue**: Include steps to reproduce, expected vs actual behavior, and any error messages
5. **Ask in Discussions**: GitHub Discussions for general questions

When reporting an issue, include:
- Platform (iOS/Android, device model, OS version)
- Expo SDK version
- Steps to reproduce
- Expected behavior
- Actual behavior
- Any error messages or screenshots
- Sentry error ID (if available)
