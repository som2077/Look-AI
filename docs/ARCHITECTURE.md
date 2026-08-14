# Look AI — Architecture Documentation

> **Status:** Living reference · **Last updated:** 2026-08-14

This document provides a detailed technical architecture overview of the Look AI application, complementing the high-level summary in the main README.

---

## Table of Contents

- [System Overview](#system-overview)
- [Client Architecture](#client-architecture)
- [Backend Architecture (Supabase)](#backend-architecture-supabase)
- [Edge Functions](#edge-functions)
- [State Management](#state-management)
- [Auth Flow](#auth-flow)
- [Image Pipeline](#image-pipeline)
- [Realtime Architecture](#realtime-architecture)
- [Security Model](#security-model)

---

## System Overview

Look AI follows a **Screaming Architecture** (Feature-Sliced Design) with a React Native / Expo client communicating with a Supabase backend. The system is designed for offline-first resilience, minimal client-side network waste, and scalable realtime features.

```
┌─────────────────────────────────────────────────────────┐
│                    React Native / Expo                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  (auth)  │  │  (root)  │  │ features │  │ shared  │ │
│  │ routes   │  │ routes   │  │ domains  │  │ utils   │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│                        │                                │
│              Expo Router (file-based)                  │
└────────────────────────┼────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │   Supabase Client   │
              │  (with caching +    │
              │   in-flight dedup)  │
              └──────────┬──────────┘
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
┌───▼───┐    ┌──────────▼──────┐    ┌───────▼──────┐
│Storage│    │  PostgreSQL +   │    │   Edge        │
│(MMKV/ │    │  RLS + Realtime │    │   Functions    │
│Secure)│    │  + Storage      │    │  (Deno)       │
└───────┘    └─────────────────┘    └───────────────┘
```

---

## Client Architecture

### Directory Structure

```
src/
├── app/                          # Expo Router file-based navigation
│   ├── (auth)/                  # Unauthenticated routes
│   │   ├── sign-in/
│   │   ├── otp/
│   │   └── _layout.tsx
│   └── (root)/                  # Authenticated workspace
│       ├── _layout.tsx          # Main tab layout + streak sync
│       ├── index.tsx            # Home dashboard
│       ├── wardrobe.tsx         # Digital closet (masonry grid)
│       ├── outfits.tsx          # AI outfit generation
│       ├── calendar.tsx         # Outfit calendar
│       ├── planner-chat.tsx     # AI planner chat
│       ├── notifications.tsx    # In-app notifications
│       ├── profile.tsx          # User profile & settings
│       └── (ai-features)/       # AI sub-routes
│           └── ...
├── features/                    # Isolated business domains
│   ├── wardrobe/
│   │   ├── api/                 # Server queries & mutations
│   │   ├── components/          # Feature-specific UI
│   │   ├── hooks/               # Feature hooks
│   │   └── types.ts
│   ├── outfits/
│   ├── payments/
│   ├── scanning/
│   ├── streaks/
│   ├── community/
│   └── profile/
└── shared/                      # Cross-feature utilities
    ├── ui/                      # Design system components
    ├── supabase/               # Client + cached query layer
    ├── realtime/               # Singleton Realtime manager
    ├── storage/                # MMKV / secure-store wrappers
    ├── cloudinary/             # Image upload services
    └── navigation/             # Navigation helpers
```

### Key Design Principles

1. **Feature Isolation**: `features/` folders cannot arbitrarily import from each other. Cross-feature communication goes through `shared/` interfaces or state management.

2. **Screaming Architecture**: Code is organized by business domain, not file type. A wardrobe feature's API, components, hooks, and types all live together.

3. **Zero Dead Weight**: Unused dependencies are removed continuously. Native OS capabilities (Expo Crypto, native image pickers) are preferred over JS polyfills.

---

## Backend Architecture (Supabase)

### Database Design

The database follows a **user-centric** model where `user_profiles` is the root entity. All other tables foreign-key to `user_profiles(user_id)`.

**Key tables:**

| Table | Purpose | RLS Policy |
|-------|---------|------------|
| `user_profiles` | Root user record (Clerk sub) | Public SELECT, owner write |
| `wardrobe_items` | Digital closet items | Owner-only |
| `logged_outfits` | Worn outfit records | Owner-only |
| `wear_logs` | Per-item wear history | Owner-only |
| `outfit_items` | Outfit ↔ wardrobe junction | Parent-EXISTS |
| `ai_recommendations` | AI outfit suggestions | Owner-only |
| `fit_check_analyses` | AI fit-check results | Owner-only |
| `virtual_try_on_generations` | VTO job tracking | Owner-only |
| `saved_labels` | Care label scan results | Owner-only |
| `user_gamification` | Streak & style score counters | Owner-only |
| `streak_logs` | Daily activity records | Owner-only |
| `planned_events` | Scheduled occasions | Owner-only |
| `community_posts` | Social feed posts | Public SELECT, owner write |
| `post_reactions` | Emoji reactions | Public SELECT, owner write |
| `post_likes` | Simple likes | Owner-only |
| `post_saves` | Bookmarked posts | Public SELECT, owner write |
| `post_comments` | Post comments | Public SELECT, owner write |
| `notifications` | In-app notifications | Owner-only |
| `badges` / `user_badges` | Badge system (currently unused) | Public / owner |
| `analytics_logs` | Error telemetry | Public INSERT, SR only read |

### Row-Level Security (RLS)

RLS is the primary security layer. Policies use the Clerk JWT `sub` claim:

```sql
-- Pattern for owner-only tables
CREATE POLICY "Owner SELECT" ON wardrobe_items
  FOR SELECT USING ((auth.jwt() ->> 'sub')::text = user_id::text);

CREATE POLICY "Owner INSERT" ON wardrobe_items
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub')::text = user_id::text);
```

**Critical note**: The legacy `auth.uid()` based policies were removed (they throw `ERROR 22P02` for Clerk's text `user_...` IDs). All policies now use `(auth.jwt() ->> 'sub')::text`.

### Indexes

Hot-path indexes exist on all query-heavy columns:

- `(user_id, category)` on `wardrobe_items` — category filtering
- `(user_id, wear_count DESC)` — "most worn" stats
- `(user_id, date DESC)` on `logged_outfits` — calendar fetches
- `(created_at DESC)` on `community_posts` — feed ordering
- GIN indexes on `season` / `occasion` arrays — array containment filters

---

## Edge Functions

All edge functions are Deno-based, deployed via `supabase functions deploy`. They sit behind Upstash Redis rate limiting.

### Function Inventory

| Function | Purpose | Rate Limit | Tables Touched |
|----------|---------|------------|----------------|
| `gemini-proxy` | Proxy Gemini `generateContent` API | 30/min/user | — |
| `planner-agent` | Gemini outfit planner (JSON mode) | 30/min/user | — (no writes) |
| `analyze-cloth-item` | Clothing analysis (upload + Gemini + remove.bg) | 5/min/user | `wardrobe_items` (via app) |
| `cloth-label-scan` | Care label OCR via Gemini | 10/min/user | `saved_labels` (via app) |
| `cloudinary-signature` | Server-side signed upload params | — | — |
| `remove-bg` | remove.bg background removal proxy | 10/min/user | — |
| `virtual-try-on` | fal.ai virtual try-on | 5/min/user | `virtual_try_on_generations` |

### Rate Limiting

Rate limiting uses a fixed-window Upstash Redis counter pattern:

```typescript
// _shared/rate-limit.ts (conceptual)
const key = `rl::${functionName}::${jwtSub}`;
const limit = getLimit(functionName); // e.g. 30 for gemini-proxy

// Fixed window: reset after 60s
const count = await redis.incr(key);
if (count > limit) {
  await redis.expire(key, 60);
  throw new Error('Rate limit exceeded');
}
```

**Fail-open design**: If Upstash is unavailable or misconfigured, requests pass through. This prevents the rate-limiter from becoming a single point of failure.

---

## State Management

### Zustand v5

Look AI uses Zustand for global state with `expo-secure-store` persistence for sensitive data.

```typescript
// Example store pattern
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

interface AuthStore {
  userId: string | null;
  nickname: string | null;
  setAuth: (data: { userId: string; nickname: string }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      userId: null,
      nickname: null,
      setAuth: (data) => set(data),
      clearAuth: () => set({ userId: null, nickname: null }),
    }),
    {
      name: 'auth-storage',
      storage: {
        setItem: SecureStore.setItemAsync,
        getItem: SecureStore.getItemAsync,
        removeItem: SecureStore.removeItemAsync,
      },
    }
  )
);
```

### Supabase Cached Fetch Layer

The `shared/supabase/use-supabase-query.ts` provides:

- **30-second module-level cache**: identical queries within 30s share one network call
- **In-flight dedup**: if 5 components mount and request the same query, only 1 HTTP request fires
- **Optimistic updates**: mutations update cache immediately, then sync with server

---

## Auth Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│   Clerk  │────▶│  Expo    │────▶│  Supabase │────▶│  PostgreSQL│
│   (Auth) │     │  Client  │     │  Client  │     │  (RLS)   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

1. **Clerk** handles authentication (Google SSO, email OTP, passwordless)
2. Clerk issues a JWT with the user's `sub` claim
3. The Supabase client injects this JWT via the `accessToken` callback in `src/shared/supabase/client.ts`
4. Supabase RLS policies use `(auth.jwt() ->> 'sub')::text` to match against `user_id` columns
5. **No Supabase `auth.users` records exist** — auth is entirely Clerk-side

### JWT Injection

```typescript
// src/shared/supabase/client.ts (conceptual)
import { createClient } from '@supabase/supabase-js';
import * as Clerk from '@clerk/clerk-expo';

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    accessToken: async () => {
      const { getToken } = await Clerk.getAuth();
      return getToken({ template: 'supabase' });
    },
  }
);
```

---

## Image Pipeline

### Upload Flow

```
Camera/Gallery → remove.bg (bg removal) → Cloudinary (hosting) → DB (Cloudinary URL)
```

1. **Capture**: User captures or selects an image via `expo-image-picker`
2. **Background removal** (optional): Image sent to `remove-bg` edge function → get clean URL
3. **Cloudinary upload**: Signed upload via `cloudinary-signature` edge function
4. **Storage**: Cloudinary CDN URL stored in DB (`wardrobe_items.image_url`, etc.)

### Storage Buckets

| Bucket | Public | Content | Policy |
|--------|--------|---------|--------|
| `try-on-uploads` | ✅ | VTO garment/model uploads | Authenticated INSERT only (10MB, image/*) |
| `full-length-pics` | ✅ | Onboarding photos | Created live, 10MB limit |

All other images are hosted on **Cloudinary**.

---

## Realtime Architecture

### Singleton Channel Pattern

Look AI uses a **single Realtime channel per (user, table) pair** to avoid subscription fan-out:

```typescript
// shared/realtime/manager.ts (conceptual)
const channels = new Map<string, RealtimeChannel>();

export function getChannel(user_id: string, table: string) {
  const key = `${user_id}:${table}`;
  if (!channels.has(key)) {
    channels.set(key, supabase
      .channel(`${key}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, handler)
      .subscribe()
    );
  }
  return channels.get(key)!;
}
```

### What's Subscribed

- `notifications` — new/updated notifications for the current user
- `wardrobe_items` — wardrobe changes (for sync across devices)

### What's NOT Subscribed

- `community_posts` — intentionally excluded. A public feed would fan out to every subscriber, causing unbounded load. The feed is pull-to-refresh + paginated instead.

---

## Security Model

### Defense in Depth

1. **Clerk Auth**: Identity verification, session management, JWT issuance
2. **Supabase RLS**: Row-level access control — every query is filtered by user identity
3. **Edge Function Rate Limiting**: Upstash Redis fixed-window counters per user
4. **Storage Policies**: Bucket-level upload limits (10MB, image/* only)
5. **SECURITY DEFINER Triggers**: Reaction/notification triggers run with elevated privileges but are pinned with `SET search_path = ''` and have `EXECUTE` revoked from PUBLIC/anon
6. **Input Validation**: All edge functions validate inputs before processing

### Removed / Deprecated Features

- **`verify-purchase` / `billing-webhook` edge functions**: Deleted — they only wrote to dropped billing tables
- **Billing tables** (`entitlements`, `purchase_tokens`, `billing_events`): Dropped, replaced by RevenueCat
- **Legacy RLS policies with `auth.uid()`**: Removed — incompatible with Clerk text user IDs
- **Community feed Realtime**: Removed — replaced by pull-to-refresh + pagination

---

## Performance Optimizations

### Client-Side

- **Cached fetch layer**: 30s TTL + in-flight dedup
- **Singleton Realtime**: One channel per (user, table)
- **Bounded reads**: All list queries are paginated or `.limit()`-ed
- **Cold-start bootstrap**: Avatar/FCM syncs run once per session, not on every mount
- **Write amplification removed**: `user_profiles` upsert runs once per session, not before every wardrobe write

### Server-Side

- **Indexes on all hot paths**: See §5 Indexes in DATABASE.md
- **Realtime publication limited**: Only `notifications` + `wardrobe_items` are published
- **Edge functions rate-limited**: 5-30 requests/minute per user depending on function cost
- **Storage hardened**: 10MB limit, image/* MIME types only, authenticated uploads for sensitive buckets

---

## Scalability Ceiling

At 10k truly-concurrent users, the primary bottleneck is **Supabase compute capacity**, not the app design. The load test (`scripts/loadtest/k6-load-test.js`) simulates the real request mix and identifies the breaking point.

**What the app design handles well:**
- Client request reduction (caching, dedup, bounded reads)
- Server-side index optimization
- Rate-limited edge functions (prevents expensive API abuse)

**What needs platform upgrade at scale:**
- Supabase compute/plan for PostgREST throughput
- Database connection pool sizing
- Edge function concurrency limits

See `scripts/loadtest/README.md` for running the load test against a dev branch.
