<div align="center">
  <img src="assets/images/logo.png" alt="LookAI Logo" width="120" />

# 👗 LookAI — Your Personal AI Stylist

**LookAI is an intelligent fashion companion built with React Native and Expo. It digitizes your wardrobe, analyzes your body type, and provides hyper-personalized, daily outfit recommendations based on real-time weather and your unique style.**

[![Expo](https://img.shields.io/badge/Expo-1C1E24?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

</div>

<br />

## 📖 Table of Contents

- [✨ Core Features](#-core-features)
- [📱 Screen Previews](#-screen-previews)
- [🚀 Comprehensive Tech Stack](#-comprehensive-tech-stack)
- [📂 Production Architecture](#-production-architecture)
- [🛠 Deep Dive: Key Modules & Workflows](#-deep-dive-key-modules--workflows)
- [🗂️ Category System](#️-category-system)
- [⚡ Scalability & Hardening (10k Concurrent Users)](#️-scalability--hardening-10k-concurrent-users)
- [⚙️ Getting Started (Local Development)](#️-getting-started-local-development)

---

## ✨ Core Features

- **🧠 AI Outfit Recommendations**: Get daily outfit suggestions mapped directly to your personal style preferences, body type, and local weather patterns.
- **📸 Intelligent Wardrobe Digitization**: Snap a photo in-app. The AI automatically detects the clothing category, occasion, and dominant colors, stripping the background automatically.
- **🌤️ Real-Time Weather Integration**: Dynamic outfits synced with live Open-Meteo data, utilizing a custom "Comfort Score" to suggest fabric weight and breathability.
- **📊 Style Scoring & Gamification**: Track your daily fashion streak, view your circular Style Score (0–100), and unlock scrolling achievement badges.
- **📌 True Pinterest-Style Masonry Grid**: Scroll your digital wardrobe via a custom-built, two-column staggered masonry layout (32px offset with 12 naturally cycling heights).
- **🔐 Secure Authentication**: Passwordless onboarding via Clerk (Google SSO + Email OTP with 30s resend timer).

---

## 📱 Screen Previews

> _(Replace placeholders with your actual high-res application screenshots)_

|                              Home Dashboard                               |                               Digital Wardrobe                                |                             AI Outfit Generation                             |                            Style Score & Stats                             |
| :-----------------------------------------------------------------------: | :---------------------------------------------------------------------------: | :--------------------------------------------------------------------------: | :------------------------------------------------------------------------: |
| <img src="https://via.placeholder.com/250x500.png?text=Home" width="250"> | <img src="https://via.placeholder.com/250x500.png?text=Wardrobe" width="250"> | <img src="https://via.placeholder.com/250x500.png?text=AI+Look" width="250"> | <img src="https://via.placeholder.com/250x500.png?text=Score" width="250"> |

---

## 🚀 Comprehensive Tech Stack

| Layer             | Technology              | Details                                                     |
| ----------------- | ----------------------- | ----------------------------------------------------------- |
| **Framework**     | Expo SDK 54 / RN 0.81.5 | Native module compilation via Prebuild                      |
| **Routing**       | Expo Router             | File-based navigation & Route Groups                        |
| **Auth**          | Clerk                   | JWT injected into Supabase headers                          |
| **Backend**       | Supabase                | PostgreSQL, RLS, Realtime, Edge Functions                   |
| **State**         | Zustand v5              | Fast, boilerplate-free state, `expo-secure-store` persisted |
| **Styling**       | NativeWind v4           | TailwindCSS 3, JIT compiled                                 |
| **Animations**    | Reanimated / Animated   | 60fps micro-interactions, modal overlays                    |
| **Vector/SVG**    | `react-native-svg`      | Smooth SVG arcs, circular progress rings                    |
| **External APIs** | Open-Meteo              | Free tier, no API key required                              |
| **Monetization**  | RevenueCat              | Server-side entitlements — no receipt webhooks to maintain  |
| **Rate Limiting** | Upstash Redis           | Fixed-window per-user limits on expensive Edge Functions    |

---

## 📂 Production Architecture (Screaming Architecture)

LookAI utilizes a Feature-Sliced / Screaming Architecture. This ensures high maintainability by organizing code by business domain rather than technical file types.

```text
src/
├── app/                    # Expo Router file-based navigation (UI shell)
│   ├── (auth)/             # Unauthenticated Routes (sign-in, otp)
│   └── (root)/             # Authenticated workspace screens (tabs, profile)
├── features/               # Isolated business domains (The Core)
│   ├── wardrobe/           # Digital wardrobe & clothing detection
│   ├── outfits/            # AI outfit recommendations & logging
│   ├── payments/           # In-app purchase paywalls & limits
│   ├── scanning/           # Background removal & Cloudinary upload
│   └── streaks/            # Gamification, scores, & progress
└── shared/                 # Reusable cross-feature utilities
    ├── ui/                 # Design system, custom components, ui-store
    ├── storage/            # Local MMKV / secure-store wrappers
    ├── supabase/           # Client + cached fetch layer (30s TTL, in-flight dedup)
    ├── realtime/           # Singleton Supabase Realtime channels (1 per user+table)
    └── cloudinary/         # Image upload services
```

---

## 🛠 Deep Dive: Key Modules & Workflows

### 1. The Pinterest Masonry Layout (`wardrobe.tsx`)

Unlike standard FlatLists, the digital wardrobe utilizes a custom two-column grid to create an authentic stagger:

- **Independent Columns**: Built using parallel `View` components wrapped in a single `ScrollView`.
- **Natural Cycling**: Card heights are assigned dynamically from a predefined `MASONRY_HEIGHTS` array (12 variations) to prevent artificial repeating patterns.
- **Visual Stagger**: The right column is translated vertically by `32px` to ensure cards never align perfectly horizontally, providing the "Pinterest" feel.
- **Grouped Alternative**: Users can toggle to a Grouped View, which utilizes horizontal `ScrollView` carousels separated by vertical group headers (e.g., _Tops, Bottoms, Footwear_).

### 2. Custom Comfort Score & Weather (`WeatherOutfitCard.tsx`)

The app uses the **Open-Meteo API** to fetch 10-minute cached forecast data via `expo-location`.

- **Algorithm**: `Comfort Score = (Temperature * 0.5) + (Humidity * 0.3) + (Wind Speed * 0.2)`
- **Dynamic UI**: Depending on the weather code (WMO), the background gradients shift, and a smooth `react-native-svg` ring fills up to indicate how comfortable an outfit needs to be for the current climate.

### 3. Monetization (`RevenueCat`)

Subscriptions are managed end-to-end by **RevenueCat**:

1. `react-native-purchases` (RevenueCat SDK) presents the native Google/Apple payment sheet.
2. RevenueCat verifies the purchase server-side and reports the entitlement.
3. `useRevenueCat()` derives paywall state (e.g. wardrobe item limits) from the entitlement.

> The legacy `verify-purchase` / `billing-webhook` edge functions were **removed** — they validated against the `entitlements`/`purchase_tokens`/`billing_events` tables, which no longer exist.

### 4. Custom Component Injection (`AddActionMenu.tsx`)

To achieve a highly premium feel, the FAB (Floating Action Button) triggers a translucent modal overlay. The component dynamically updates the global `StatusBar` and Android Navigation Bar colors to match the dimmed overlay precisely while the menu is open, ensuring a native edge-to-edge aesthetic.

---

## 🪒 Lean Engineering & The "Ponytail" Philosophy

LookAI is built with aggressive optimization in mind. We strictly adhere to a "less code is better code" philosophy:

- **Zero Dead Weight**: Continuous auditing removes unused dependencies instantly.
- **Native Over JS**: We rely on OS-level capabilities (like Expo Crypto and native Image Pickers) instead of shipping heavy Javascript polyfills.
- **Strict Boundaries**: Our `features/` folders cannot arbitrarily import from each other without clear interfaces, preventing spaghetti code as the app scales.

---

## 🗂️ Category System

LookAI boasts an extensive schema supporting **41 distinct clothing categories** designed for global fashion.
The database and UI filter chips handle categories like: `top`, `bottoms`, `footwear`, `outerwear`, `dress`, `ethnic`, `accessory`, `activewear`, `sportswear`, `formal`, `casual`, `partywear`, and many more.

---

## ⚡ Scalability & Hardening (10k Concurrent Users)

LookAI is engineered to survive high request rates without self-inflicted collapse. The hardening is layered — strip client waste first, then back it with DB + edge capacity.

### Client request reduction (`src/`)

- **Cached fetch layer** (`shared/supabase/use-supabase-query.ts`): 30s module-level cache + in-flight dedup, so N screens mounting the same query share **one** network call.
- **Community feed rework**: the Realtime channel and 2s debounced full refetch are gone — the feed is pull-to-refresh + optimistic updates, paginated newest-first (`.range(0, 49)`), with the heavy nested `post_comments` select moved to the post screen.
- **Singleton Realtime** (`shared/realtime/manager.ts`): one channel per `(user, table)` — notifications + wardrobe share a single subscription.
- **Cold-start bootstrap**: avatar/FCM syncs run once per session; the old 60s HEAD probe now fires only on foreground-return with a 60s minimum interval.
- **Bounded reads**: every list query is paginated or `.limit()`-ed (wardrobe, ring stats, calendar).
- **Write amplification removed**: the redundant `user_profiles` upsert runs once per session, not before every wardrobe write.

### Backend (Supabase)

- **Indexes**: hot-path indexes on `notifications`, `post_comments`, `post_saves`, `post_likes`, `analytics_logs`; duplicate `community_posts` indexes dropped.
- **Realtime publication**: now publishes `notifications` + `wardrobe_items` so personal channels actually deliver. `community_posts` is **intentionally excluded** — a public feed would fan out to every subscriber (see the realtime note in `DATABASE.md`).
- **Edge-function rate limiting** (`supabase/functions/_shared/rate-limit.ts`): fixed-window Upstash Redis counters keyed by JWT `sub`, **fail-open** when Upstash is unavailable. Per-user/minute limits: `gemini-proxy` 30, `planner-agent` 30, `analyze-cloth-item` 5, `cloth-label-scan` 10, `remove-bg` 10, `virtual-try-on` 5.
- **Security**: `verify_jwt = true` on `virtual-try-on`; anon-executable `SECURITY DEFINER` functions revoked (RPCs + reaction triggers); storage buckets now 10MB/image-only with authenticated uploads; dead billing functions removed.

### Load testing

A k6 script ([`scripts/loadtest/`](scripts/loadtest/README.md)) simulates the app's real request mix (feed / notifications / wardrobe reads + like / reaction / comment writes) with per-VU JWTs. **Run it against a Supabase dev branch, never production.**

> **Ops note:** this strips the avoidable load so the app hits the platform ceiling. Real 10k _truly-concurrent_ users still needs a Supabase compute/plan upgrade — the load test pinpoints the bottleneck.

---

## ⚙️ Getting Started (Local Development)

### Prerequisites

- **Node.js 18+**
- **Expo CLI** (`npm i -g expo-cli`)
- **Clerk Account** (for Auth keys)
- **Supabase Project** (for PostgreSQL URL/Keys)

### 1. Clone & Install

```bash
git clone https://github.com/som2077/Look-AI.git
cd Look-AI
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory (the `EXPO_PUBLIC_` prefix is required for values bundled into the app):

```env
# Auth
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx

# Gemini (vision scans, label OCR, planner chat)
GOOGLE_GEMINI_API_KEY=xxx
EXPO_PUBLIC_GEMINI_API_KEY=xxx

# remove.bg (background removal) — comma-separated to support key rotation
EXPO_PUBLIC_REMOVE_BG_API_KEYS=xxx
REMOVEBG_API_KEY=xxx

# Cloudinary (image hosting + upload signing)
CLOUDINARY_URL=cloudinary://...
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=xxx
EXPO_PUBLIC_CLOUDINARY_API_KEY=xxx
EXPO_PUBLIC_CLOUDINARY_API_SECRET=xxx

# fal.ai (virtual try-on)
FAL_KEY=xxx

# Upstash Redis (edge-function rate limiting)
EXPO_PUBLIC_UPSTASH_REDIS_REST_URL=xxx
EXPO_PUBLIC_UPSTASH_REDIS_REST_TOKEN=xxx

# RevenueCat (subscriptions / paywall)
EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY=xxx
```

### 3. Start the Development Server

```bash
npx expo start --clear
```

_Press `a` for Android, `i` for iOS, or scan the QR code using the Expo Go app._

### 4. Backend setup (one-time)

Deploy the edge functions (this also ships the rate-limit helper `_shared/rate-limit.ts`):

```bash
supabase functions deploy gemini-proxy planner-agent analyze-cloth-item cloth-label-scan remove-bg virtual-try-on
```

Set the secrets the functions read at runtime:

```bash
supabase secrets set GOOGLE_GEMINI_API_KEY=xxx EXPO_PUBLIC_REMOVE_BG_API_KEYS=xxx FAL_KEY=xxx
supabase secrets set UPSTASH_REDIS_REST_URL=xxx UPSTASH_REDIS_REST_TOKEN=xxx
```

Push migrations (indexes, realtime publication, RPC/storage security — already applied live on the main project):

```bash
supabase db push
```

Remove the retired billing functions from the dashboard (they no longer exist in this repo): **Settings → Functions → `verify-purchase`, `billing-webhook`**.

Run the load test against a **dev branch** (never production):

```bash
k6 run -e SUPABASE_URL=https://<branch>.supabase.co -e SUPABASE_JWT_SECRET=<jwt-secret> -e MAX_VUS=200 scripts/loadtest/k6-load-test.js
```

---

<div align="center">
  <p>Built with ❤️ for modern fashion.</p>
</div>

<!-- sdk.dir=C\:\\Users\\skynet\\AppData\\Local\\Android\\Sdk  -->
