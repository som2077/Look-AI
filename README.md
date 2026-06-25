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

> *(Replace placeholders with your actual high-res application screenshots)*

| Home Dashboard | Digital Wardrobe | AI Outfit Generation | Style Score & Stats |
|:---:|:---:|:---:|:---:|
| <img src="https://via.placeholder.com/250x500.png?text=Home" width="250"> | <img src="https://via.placeholder.com/250x500.png?text=Wardrobe" width="250"> | <img src="https://via.placeholder.com/250x500.png?text=AI+Look" width="250"> | <img src="https://via.placeholder.com/250x500.png?text=Score" width="250"> |

---

## 🚀 Comprehensive Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Framework** | Expo SDK 54 / RN 0.81.5 | Native module compilation via Prebuild |
| **Routing** | Expo Router | File-based navigation & Route Groups |
| **Auth** | Clerk | JWT injected into Supabase headers |
| **Backend** | Supabase | PostgreSQL, RLS, Database Functions |
| **State** | Zustand v5 | Fast, boilerplate-free state, `expo-secure-store` persisted |
| **Styling** | NativeWind v4 | TailwindCSS 3, JIT compiled |
| **Animations** | Reanimated / Animated | 60fps micro-interactions, modal overlays |
| **Vector/SVG** | `react-native-svg` | Smooth SVG arcs, circular progress rings |
| **External APIs** | Open-Meteo | Free tier, no API key required |
| **Monetization**| `react-native-iap` | Webhook verification via Deno Edge Functions |

---

## 📂 Production Architecture

LookAI utilizes an enterprise-grade **Route Group** architecture. This ensures high maintainability by organizing features logically without affecting URL strings (e.g., `app/(root)/(analytics)/score.tsx` resolves simply to `/score`).

```text
app/
├── UNNECESSARY/            # Deprecated prototypes / Unused demo files
├── (auth)/                 # Unauthenticated Routes
│   ├── sign-in.tsx         # OAuth & Email providers
│   └── email.tsx           # OTP Validation screen
└── (root)/                 # Authenticated workspace screens
    ├── _layout.tsx         # Global Auth Guard wrapper
    ├── calendar.tsx        # Calendar: Outfit wear logs & scheduling
    ├── (ai-features)/      # AI & Recommendation engine UI
    ├── (analytics)/        # Gamification & tracking metrics
    ├── (social)/           # Social interaction & fashion feeds
    ├── (subscription)/     # In-app purchase paywalls
    ├── (wardrobe)/         # Wardrobe discovery
    ├── (tabs)/             # Swipeable Bottom Tab navigation
    │   ├── _layout.tsx     
    │   ├── index.tsx       # Home: Highlights, trend feeds, stats
    │   ├── explore.tsx     # Explore: Discover new outfits and trends
    │   ├── wardrobe.tsx    # Wardrobe: Pinterest masonry grid
    │   └── profile.tsx     # Profile: Bio summary, body stats
    ├── add-clothes/        # Multi-step camera/upload wizard
    ├── cloth-details/      # Detailed view for specific clothing items
    ├── log-outfit/         # Daily wearer logging wizard
    ├── onboarding/         # 6-step new user preference forms
    └── post/               # Creating and sharing fashion posts
```

---

## 🛠 Deep Dive: Key Modules & Workflows

### 1. The Pinterest Masonry Layout (`wardrobe.tsx`)
Unlike standard FlatLists, the digital wardrobe utilizes a custom two-column grid to create an authentic stagger:
- **Independent Columns**: Built using parallel `View` components wrapped in a single `ScrollView`.
- **Natural Cycling**: Card heights are assigned dynamically from a predefined `MASONRY_HEIGHTS` array (12 variations) to prevent artificial repeating patterns.
- **Visual Stagger**: The right column is translated vertically by `32px` to ensure cards never align perfectly horizontally, providing the "Pinterest" feel.
- **Grouped Alternative**: Users can toggle to a Grouped View, which utilizes horizontal `ScrollView` carousels separated by vertical group headers (e.g., *Tops, Bottoms, Footwear*).

### 2. Custom Comfort Score & Weather (`WeatherOutfitCard.tsx`)
The app uses the **Open-Meteo API** to fetch 10-minute cached forecast data via `expo-location`. 
- **Algorithm**: `Comfort Score = (Temperature * 0.5) + (Humidity * 0.3) + (Wind Speed * 0.2)`
- **Dynamic UI**: Depending on the weather code (WMO), the background gradients shift, and a smooth `react-native-svg` ring fills up to indicate how comfortable an outfit needs to be for the current climate.

### 3. Serverless Billing Architecture (`billing-webhook`)
Handling IAP strictly client-side is insecure. LookAI uses a robust hybrid approach:
1. `react-native-iap` triggers the native Google/Apple payment sheet.
2. The App Store fires a Pub/Sub notification to our **Supabase Edge Function** (`verify-purchase/index.ts`).
3. The serverless Deno function securely contacts the Google Play Developer API to validate the receipt token.
4. Upon success, the user's `entitlement` table is updated in PostgreSQL, unlocking AI features.

### 4. Custom Component Injection (`AddActionMenu.tsx`)
To achieve a highly premium feel, the FAB (Floating Action Button) triggers a translucent modal overlay. The component dynamically updates the global `StatusBar` and Android Navigation Bar colors to match the dimmed overlay precisely while the menu is open, ensuring a native edge-to-edge aesthetic.

---

## 🗂️ Category System

LookAI boasts an extensive schema supporting **41 distinct clothing categories** designed for global fashion. 
The database and UI filter chips handle categories like: `top`, `bottoms`, `footwear`, `outerwear`, `dress`, `ethnic`, `accessory`, `activewear`, `sportswear`, `formal`, `casual`, `partywear`, and many more.

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
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxx
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxx
```

### 3. Start the Development Server
```bash
npx expo start --clear
```
*Press `a` for Android, `i` for iOS, or scan the QR code using the Expo Go app.*

---
<div align="center">
  <p>Built with ❤️ for modern fashion.</p>
</div>


<!-- sdk.dir=C\:\\Users\\skynet\\AppData\\Local\\Android\\Sdk  -->