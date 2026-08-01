# Look AI — Codebase Bug Report

**Generated:** 2026-08-01  
**Scope:** Full source audit (`src/`, root config, server files)  
**TypeScript:** ✅ Passed (0 errors)  
**ESLint:** ⚠️ 70+ warnings (0 project-source errors, many `.agents/` errors excluded)

---

## Executive Summary

The app is type-safe, but contains **8 critical/high-priority runtime bugs** that can cause crashes, data loss, silent failures, or broken uploads. There are also several medium-priority issues around stale closures, memory leaks, and security concerns.

| Severity | Count |
|----------|-------|
| 🔴 Critical | 4 |
| 🟠 High | 4 |
| 🟡 Medium | 7 |
| 🟢 Low / Cleanup | 6 |

---

## 🔴 Critical Bugs

### 1. Cloudinary Upload — Broken `multipart/form-data` Header
**File:** `src/features/scanning/api/cloudinary-upload.ts` **Lines 82–89**

```ts
const response = await fetch(url, {
  method: "POST",
  body: formData,
  headers: {
    Accept: "application/json",
    "Content-Type": "multipart/form-data",   // ← BUG
  },
});
```

When using `FormData` with `fetch()`, the runtime **must** auto-generate the `Content-Type` header including the multipart boundary. Manually overriding it with `"multipart/form-data"` strips the boundary, causing Cloudinary to reject the upload with a parsing error.

**Fix:** Remove the `"Content-Type": "multipart/form-data"` line entirely.

---

### 2. Cloudinary Upload — Passing Base64 String Instead of Blob/File
**File:** `src/features/scanning/api/cloudinary-upload.ts` **Line 75**

```ts
formData.append("file", transparentImageUri as any); // Upload the base64 URI directly
```

`transparentImageUri` is a base64 data URI string (`data:image/png;base64,...`). Cloudinary expects a `Blob`, `File`, or raw binary in the `file` field. Passing a string may be rejected or treated as a remote URL fetch (which will fail).

**Fix:** Convert the base64 string to a `Blob` before appending:
```ts
const blob = await (await fetch(transparentImageUri)).blob();
formData.append("file", blob, "image.png");
```

---

### 3. Cloudinary `publicId` Extraction Ignores Folder Paths
**File:** `src/features/scanning/api/cloudinary-upload.ts` **Lines 114–124**

```ts
const parts = url.split("/");
const filename = parts.pop();
return filename.split(".")[0];
```

Cloudinary URLs with folders (e.g. `…/upload/v123/wardrobe/item_abc.jpg`) will extract `item_abc` instead of `wardrobe/item_abc`. Calling `deleteFromCloudinary` with the wrong public ID will silently fail to delete.

**Fix:** Parse the path segment after `/upload/` (or versioned `/upload/v\d+/`).

---

### 4. RevenueCat Listener Registered Without Configuration Guard
**File:** `src/features/payments/model/useRevenueCat.ts` **Lines 85–95**

```ts
useEffect(() => {
  const customerInfoUpdated = async (purchaserInfo: CustomerInfo) => {
    checkProStatus(purchaserInfo);
  };
  Purchases.addCustomerInfoUpdateListener(customerInfoUpdated);
  return () => {
    Purchases.removeCustomerInfoUpdateListener(customerInfoUpdated);
  };
}, []);
```

The first `useEffect` skips `Purchases.configure()` when a dummy key is detected, but this second effect **always** adds a listener. If the SDK was never configured, `addCustomerInfoUpdateListener` may throw an uninitialized error or crash on some platforms.

**Fix:** Gate the listener behind the same `isDummyKey` check, or check `Purchases.isConfigured()` if available.

---

## 🟠 High-Priority Bugs

### 5. Gemini Vision — Silent Total Failure (No Observability)
**File:** `src/features/scanning/api/gemini-scan.ts` **Lines 137–153**

```ts
for (const model of MODELS) {
  try {
    const { data, error } = await supabase.functions.invoke("gemini-proxy", {…});
    if (error) continue;
    …
  } catch {
    continue;   // ← BUG: swallows every error silently
  }
}
return null;
```

If all 3 models fail (network down, edge function error, rate limit), the function returns `null` with **zero logging**. The UI receives no actionable error message and shows a generic fallback.

**Fix:** Log the specific error per model, and return/throw a descriptive error after all retries are exhausted.

---

### 6. Gemini JSON Parser — Greedy Regex Matches Across Multiple JSON Blocks
**File:** `src/features/scanning/api/gemini-scan.ts` **Lines 155–164**

```ts
const match = text.match(/\{[\s\S]*\}/);
```

This regex is **greedy** and will match from the first `{` to the last `}` in the entire string. If the model returns markdown-wrapped JSON or multiple objects, the extracted text is invalid JSON and parsing fails, falling back to generic defaults silently.

**Fix:** Use a non-greedy regex and markdown-code-block stripping:
```ts
const match = text.match(/\{[\s\S]*?\}/);
// or better: strip markdown fences first, then parse
```

---

### 7. Community Posts — Reaction Optimistic Update Uses Wrong User ID Space
**File:** `src/features/social/api/useCommunityPosts.ts` **Lines 188–227**

In `toggleReaction`, the optimistic update filters reactions by `userId` (Clerk ID):
```ts
newReactions.filter((r: any) => r.user_id !== userId)
```

But the database stores **profile IDs** (from `user_profiles` table), not Clerk `user_id`s. The `post_reactions.user_id` column references `user_profiles.id`. The optimistic UI will appear to work, but the actual DB state and rollback logic are mismatched.

**Fix:** Resolve the user's `profile.id` first and use that consistently.

---

### 8. Community Posts — Like Rollback Reads Stale Closure State
**File:** `src/features/social/api/useCommunityPosts.ts` **Lines 176–184**

```ts
setLikedPostIds((prev) => {
  const next = new Set(prev);
  if (likedPostIds.has(postId)) {   // ← reads outer closure, not current prev
    next.add(postId);
  } else {
    next.delete(postId);
  }
  return next;
});
```

The rollback logic inside the functional update reads `likedPostIds` from the closure instead of `prev`. If state has changed since the toggle started, the rollback reverts to the wrong value.

**Fix:** Use `prev.has(postId)` instead of `likedPostIds.has(postId)`.

---

## 🟡 Medium-Priority Bugs

### 9. Supabase Client Leaked on Auth Changes
**File:** `src/shared/supabase/use-supabase.ts` **Lines 11, 28–51**

```ts
const clientRef = useRef<SupabaseClient>(createSupabaseClient());
```

A new Supabase client is created every time `isLoaded`, `isSignedIn`, or `userId` changes. The old client's realtime subscriptions and retry timers are **never cleaned up**, causing memory leaks and duplicate channel listeners.

**Fix:** Remove old channels/subscriptions before replacing the client, or only recreate when `isSignedIn` actually flips.

---

### 10. Planner Chat — Boot `useEffect` Has Stale Dependencies
**File:** `src/app/(root)/(ai-features)/planner-chat.tsx` **Lines 133–153**

```ts
useEffect(() => {
  if (params.date) {
    …
    setTimeout(() => runWeatherStep(preDate, preTime), 300);
  } else { … }
}, []);   // ← missing deps: params.date, params.time, runWeatherStep
```

If the component re-mounts or params change, the effect uses stale values. `runWeatherStep` is recreated on every render but captured in the stale closure.

**Fix:** Add dependencies or wrap `runWeatherStep` in `useCallback` with correct deps.

---

### 11. Weather Outfit Card — Animated Listener Missing Cleanup on Re-render
**File:** `src/features/ai-styling/ui/WeatherOutfitCard.tsx` **Lines 81–86**

```ts
useEffect(() => {
  const id = progress.addListener(({ value }) => {
    setDashOffset(circumference * (1 - value));
  });
  return () => progress.removeListener(id);
}, []);   // ← missing deps: progress, circumference
```

If the parent re-renders with a new `score`, a new `progress` Animated.Value is created, but the old listener is never removed because the effect doesn't re-run. This leaks listeners and may show stale animation values.

**Fix:** Add `[progress, circumference]` to the dependency array.

---

### 12. Calendar Screen — Weather Data Is Hardcoded
**File:** `src/app/(root)/calendar.tsx` **Lines 363–365**

```tsx
<IconCloudRain size={16} color="#9CA3AF" />
<Text style={{ fontSize: 11, color: "#9CA3AF" }}>28° 26°</Text>
```

Every day in the date strip shows the same static `28° 26°` with a rain icon, regardless of actual weather or date. This is dead UI data.

**Fix:** Wire to the weather store or remove the weather display until implemented.

---

### 13. Batch Scan — `selectedIds` Sync Effect Has Stale Closure
**File:** `src/app/(root)/add-clothes/batch-scan.tsx` **Lines 76–83**

```ts
useEffect(() => {
  const newIds = items.map((i) => i.id).filter((id) => !selectedIds.includes(id));
  if (newIds.length > 0) {
    setSelectedIds((prev) => [...prev, ...newIds]);
  }
}, [items]);   // ← missing dep: selectedIds
```

ESLint flags this. If `selectedIds` changes between renders, the effect operates on stale data and may add duplicates.

**Fix:** Either add `selectedIds` to deps (may cause loop; use functional update instead) or restructure to avoid the stale read.

---

### 14. Explore Feed — Auto-Scrolls to Bottom on Every Post Count Change
**File:** `src/app/(root)/(tabs)/explore.tsx` **Lines 520–525**

```ts
onContentSizeChange={() => {
  if (posts.length !== previousPostsLength.current) {
    scrollRef.current?.scrollToEnd({ animated: true });
    previousPostsLength.current = posts.length;
  }
}}
```

Whenever a new post is fetched (or the list reorders), the ScrollView jumps to the bottom. This is jarring UX, especially when the user is reading top posts.

**Fix:** Only auto-scroll when the *current user* adds a new post, not on every fetch.

---

### 15. Hardcoded Supabase Credentials in Source
**File:** `src/app/(root)/(ai-features)/planner-chat.tsx` **Lines 26–28**

```ts
const SUPABASE_URL = "https://nekfjladdbzzgwzxtscc.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5la2ZqbGFkZGJ6emd3enh0c2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NzQzODksImV4cCI6MjA5MjA1MDM4OX0.WXdJbQqlIInHS5jPfBM6a84TzAk474G5ehDP7CfOJgs";
```

Anon keys are technically public, but hardcoding them makes rotation painful and exposes the project reference. These should be env vars.

---

## 🟢 Low-Priority / Cleanup Issues

### 16. Deno Server File in React Native Project
**File:** `server.ts` (root)

This is a full copy of Deno's `std/http/server.ts`. It has no place in an Expo/React Native project and bloats the repo. It imports from `"../async/mod.ts"` which doesn't exist at that relative path, making it broken standalone.

**Fix:** Delete if unused, or move to a separate backend repo.

---

### 17. Unicode BOM in Source Files
**Files:**
- `src/app/(root)/log-outfit/analyzing.tsx`
- `src/features/scanning/ui/ScanningOverlay.tsx`

These files start with a Unicode Byte Order Mark. While most tools handle it, it can cause unexpected parsing issues in bundlers or edge functions.

**Fix:** Re-save as UTF-8 without BOM.

---

### 18. Unused Variables & Imports (Code Bloat)
**ESLint reports 50+ warnings.** Key hotspots:
- `src/app/(root)/(tabs)/explore.tsx` — unused imports: `IconSend`, `IconX`, `Video`, `ResizeMode`, etc.
- `src/app/(root)/(tabs)/wardrobe.tsx` — unused `CATEGORY_TABS`, `headerTranslateY`, `headerOpacity`
- `src/app/(root)/calendar.tsx` — 12+ unused variables (`scrollEnabled`, `deviceEvents`, etc.)
- `src/app/(root)/cloth-details/[id].tsx` — 10+ unused variables

**Fix:** Run an automated cleanup pass.

---

### 19. Missing `useEffect` Dependencies (React Hooks)
**ESLint `react-hooks/exhaustive-deps` flags 15+ instances.** Most impactful:
- `planner-chat.tsx:153` — missing `params.date`, `params.time`, `runWeatherStep`
- `WeatherOutfitCard.tsx:223` — missing `fetchWeather`
- `notifications.tsx:33` — missing `markAllAsRead`
- `useCommunityPosts.ts:134` — missing `fetchPosts`

**Fix:** Review each flagged hook. Most are false-positive-safe to fix; a few may require `useCallback` refactoring.

---

### 20. `uriToBase64` — No Network Error Handling
**File:** `src/features/scanning/api/gemini-scan.ts` **Lines 92–104**

```ts
const response = await fetch(uri);
const blob = await response.blob();
```

If `fetch` throws (network error, invalid URI), the error bubbles up unhandled to callers. The `callGeminiVision` wrapper catches it and returns `null`, but `uriToBase64` itself has no defensive handling.

**Fix:** Add a try/catch or timeout in `uriToBase64`.

---

### 21. Calendar — Drag-and-Drop Gesture State Unused
**File:** `src/app/(root)/calendar.tsx` **Lines 75–133**

A full drag-and-drop gesture system is implemented (`Gesture.Tap`, `Gesture.Pan`, `useSharedValue`, `useAnimatedStyle`) but the resulting `animatedEventStyle` is **never applied to any element**. The draft event state is also unused in the rendered output.

**Fix:** Either wire up the gesture UI or remove the dead code to reduce bundle size.

---

## Recommended Priority Order

1. **Fix Cloudinary upload** (Critical #1, #2, #3) — image uploads are core functionality.
2. **Fix RevenueCat listener guard** (Critical #4) — prevents crashes on launch for dev builds.
3. **Fix Gemini error handling** (High #5, #6) — improves AI reliability and user feedback.
4. **Fix Community Posts reaction ID mismatch** (High #7) — data integrity issue.
5. **Fix like rollback stale closure** (High #8) — UI state corruption on network errors.
6. **Clean up hook dependencies** (Medium #10, #11, #13, #19) — prevents stale closures and memory leaks.
7. **Remove hardcoded credentials** (Medium #15) — security hygiene.
8. **Delete or relocate `server.ts`** (Low #16) — repo hygiene.
