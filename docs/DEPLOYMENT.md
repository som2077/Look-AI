# Look AI — Deployment Guide

> **Status:** Living reference · **Last updated:** 2026-08-14

This guide covers deploying Look AI to production, including environment setup, Expo/EAS configuration, Supabase deployment, and edge function publishing.

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Variables (Production)](#environment-variables-production)
- [Expo / EAS Build](#expo--eas-build)
- [Supabase Backend Setup](#supabase-backend-setup)
- [Edge Functions Deployment](#edge-functions-deployment)
- [App Store Submission](#app-store-submission)
- [CI/CD (Optional)](#cicd-optional)
- [Rollback Plan](#rollback-plan)
- [Post-Deployment Checklist](#post-deployment-checklist)

---

## Overview

Look AI is a React Native / Expo app with a Supabase backend. The deployment pipeline has two main parts:

1. **Client**: Built with Expo → EAS Build → submitted to App Store / Play Store
2. **Backend**: Supabase project (PostgreSQL, Edge Functions, Storage) + Clerk for auth

```
┌──────────────────────────────────────────────────────┐
│                    DEV / STAGING                      │
│  ┌─────────────┐    ┌──────────────────────────┐     │
│  │  Expo Dev   │    │  Supabase Dev Branch     │     │
│  │  (local)    │    │  (isolated DB + funcs)   │     │
│  └─────────────┘    └──────────────────────────┘     │
└──────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────┐
│                    PRODUCTION                          │
│  ┌──────────────┐   ┌──────────────┐  ┌───────────┐ │
│  │  App Store   │   │  Play Store  │  │ Supabase  │ │
│  │  (iOS)       │   │  (Android)   │  │ Production│ │
│  └──────────────┘   └──────────────┘  └───────────┘ │
│                          │                           │
│                 ┌────────▼────────┐                  │
│                 │     Clerk       │                  │
│                 │  (Production)   │                  │
│                 └─────────────────┘                  │
└──────────────────────────────────────────────────────┘
```

---

## Prerequisites

- **Expo Account** with EAS enabled (https://expo.dev)
- **Apple Developer Account** ($99/year) for iOS builds
- **Google Play Console** ($25 one-time) for Android builds
- **Supabase Project** (production instance)
- **Clerk Project** (production instance, with production keys)
- **RevenueCat Project** (for subscriptions)
- **Firebase Project** (for push notifications — FCM)

---

## Environment Variables (Production)

Production environment variables must be set in **two places**:

1. **Expo EAS environment variables** (for client build time)
2. **Supabase secrets** (for edge function runtime)

### Expo EAS Environment Variables

Set these via `eas env:set` or the Expo dashboard:

```bash
# Auth
eas env:set -p production --env EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_prod_xxx

# Supabase
eas env:set -p production --env EXPO_PUBLIC_SUPABASE_URL=https://prod.supabase.co
eas env:set -p production --env EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJprod_xxx

# Gemini
eas env:set -p production --env GOOGLE_GEMINI_API_KEY=xxx
eas env:set -p production --env EXPO_PUBLIC_GEMINI_API_KEY=xxx

# remove.bg
eas env:set -p production --env EXPO_PUBLIC_REMOVE_BG_API_KEYS=xxx
eas env:set -p production --env REMOVEBG_API_KEY=xxx

# Cloudinary
eas env:set -p production --env CLOUDINARY_URL=cloudinary://prod_xxx
eas env:set -p production --env EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=xxx
eas env:set -p production --env EXPO_PUBLIC_CLOUDINARY_API_KEY=xxx
eas env:set -p production --env EXPO_PUBLIC_CLOUDINARY_API_SECRET=xxx

# fal.ai
eas env:set -p production --env FAL_KEY=xxx

# Upstash Redis
eas env:set -p production --env EXPO_PUBLIC_UPSTASH_REDIS_REST_URL=xxx
eas env:set -p production --env EXPO_PUBLIC_UPSTASH_REDIS_REST_TOKEN=xxx

# RevenueCat
eas env:set -p production --env EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY=xxx
```

> **Note**: Values prefixed with `EXPO_PUBLIC_` are bundled into the app binary. Non-prefixed values (like `CLOUDINARY_URL`, `FAL_KEY`) are available at build time but not in the runtime bundle.

### Supabase Secrets (Edge Functions)

Set these in the Supabase dashboard (Settings → Secrets) or via CLI:

```bash
supabase secrets set -h https://prod.supabase.co \
  GOOGLE_GEMINI_API_KEY=xxx \
  EXPO_PUBLIC_REMOVE_BG_API_KEYS=xxx \
  FAL_KEY=xxx \
  UPSTASH_REDIS_REST_URL=xxx \
  UPSTASH_REDIS_REST_TOKEN=xxx
```

---

## Expo / EAS Build

### 1. Configure EAS

Create `eas.json` in the project root (if not already present):

```json
{
  "cli": {
    "version": ">= 9.0.0"
  },
  "build": {
    "development": {
      "devClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "app-bundle"
      }
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

### 2. Configure App Credentials

For iOS, you need:
- Apple Team ID
- Bundle identifier (e.g., `com.yourcompany.lookai`)
- Provisioning profile (managed by EAS if using `expo-cli` credentials)

For Android, you need:
- Keystore (upload key) — EAS can manage this for you
- Package name (e.g., `com.yourcompany.lookai`)

Configure in `app.json` or `app.config.ts`:

```json
{
  "expo": {
    "name": "LookAI",
    "slug": "look-ai",
    "version": "4.2.9",
    "ios": {
      "bundleIdentifier": "com.yourcompany.lookai",
      "buildNumber": "1",
      " googleServicesFile": "./google-services.json"
    },
    "android": {
      "package": "com.yourcompany.lookai",
      "versionCode": 1,
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      "expo-router",
      "@clerk/clerk-expo",
      "expo-notifications",
      "react-native-reanimated"
    ]
  }
}
```

### 3. Build the App

```bash
# Build for production (both platforms)
eas build --platform all --profile production

# Build iOS only
eas build --platform ios --profile production

# Build Android only
eas build --platform android --profile production
```

EAS will:
- Compile the native app
- Sign it with your credentials
- Upload the build artifact to Expo's servers
- Provide a URL to download or submit to stores

### 4. Submit to Stores

```bash
# Submit to both stores (requires store credentials configured)
eas submit --platform all --latest

# Submit iOS only
eas submit --platform ios

# Submit Android only
eas submit --platform android
```

Alternatively, download the build and submit manually via:
- **App Store Connect** (iOS)
- **Google Play Console** (Android)

---

## Supabase Backend Setup

### 1. Create Production Project

Create a new Supabase project for production (don't reuse dev):

```bash
# Via dashboard: https://supabase.com/dashboard
# Or via CLI:
supabase init
supabase link --project-ref <production-project-ref>
```

### 2. Set Up Authentication (Clerk Integration)

No Supabase auth users are created — auth is entirely Clerk. But you need to configure:

1. **JWT Template in Clerk**: Create a template named `supabase` that includes the user's `sub` claim
2. **Supabase Anon Key**: Use this in the Expo app's Supabase client
3. **RLS Policies**: Ensure all policies use `(auth.jwt() ->> 'sub')::text` (not `auth.uid()`)

### 3. Deploy Database Migrations

```bash
# Push all migrations to production
supabase db push

# Or, if using migration files:
supabase migration up
```

> **Warning**: `supabase db push` is for production only if you're certain of the migration order. In most cases, use the Supabase dashboard's SQL editor to apply migrations one by one, or use `supabase migration up` for controlled deployment.

### 4. Set Up Storage Buckets

Create the required storage buckets:

```sql
-- try-on-uploads bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('try-on-uploads', 'try-on-uploads', true);

-- Set policies: authenticated inserts only, public reads
CREATE POLICY "Authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'try-on-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'try-on-uploads');
```

Set bucket-level limits (via dashboard or SQL):
- `file_size_limit = 10 MB`
- `allowed_mime_types = image/*`

### 5. Deploy Edge Functions

```bash
# Deploy all edge functions
supabase functions deploy gemini-proxy planner-agent analyze-cloth-item cloth-label-scan remove-bg virtual-try-on cloudinary-signature

# Set secrets for edge functions (if not already set)
supabase secrets set GOOGLE_GEMINI_API_KEY=xxx EXPO_PUBLIC_REMOVE_BG_API_KEYS=xxx FAL_KEY=xxx UPSTASH_REDIS_REST_URL=xxx UPSTASH_REDIS_REST_TOKEN=xxx
```

Each function must have its `config.toml` configured:

```toml
# supabase/functions/<function-name>/config.toml
[functions.<function-name>]
  verify_jwt = true   # Required for virtual-try-on
  [functions.<function-name>.cors]
    allow_origins = ["*"]
```

### 6. Enable Realtime

Ensure Realtime is enabled for the required tables:

```sql
-- Enable Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Enable Realtime for wardrobe_items
ALTER PUBLICATION supabase_realtime ADD TABLE wardrobe_items;

-- Note: community_posts is intentionally NOT added to realtime publication
```

---

## Edge Functions Deployment

### Function Inventory (Production)

| Function | Purpose | Rate Limit | Verify JWT |
|----------|---------|------------|------------|
| `gemini-proxy` | Gemini API proxy | 30/min/user | No |
| `planner-agent` | Outfit planner chat | 30/min/user | No |
| `analyze-cloth-item` | Clothing analysis | 5/min/user | No |
| `cloth-label-scan` | Care label OCR | 10/min/user | No |
| `remove-bg` | Background removal | 10/min/user | No |
| `virtual-try-on` | fal.ai try-on | 5/min/user | **Yes** |
| `cloudinary-signature` | Signed uploads | — | No |

### Pre-Deployment Checklist

- [ ] All `config.toml` files are set (especially `verify_jwt = true` for virtual-try-on)
- [ ] Secrets are set on the production Supabase project
- [ ] Upstash Redis is configured and reachable from Supabase edge functions
- [ ] Rate limiting helper (`_shared/rate-limit.ts`) is included in each function deployment
- [ ] CORS is configured if the function is called from web clients

### Testing Before Deployment

Always test edge functions against a **dev branch** first:

```bash
# Create a Supabase dev branch
supabase branch create test-deploy

# Deploy functions to the branch
supabase functions deploy --branch test-deploy <function-name>

# Test locally
supabase functions serve <function-name>

# Run load test against the branch
k6 run -e SUPABASE_URL=https://<branch>.supabase.co -e SUPABASE_JWT_SECRET=<secret> scripts/loadtest/k6-load-test.js
```

---

## App Store Submission

### iOS (App Store Connect)

1. **Create App Record**: In App Store Connect, create a new app with your bundle ID
2. **Upload Build**: Use `eas submit --platform ios` or upload manually via Transporter
3. **Fill Metadata**: App name, subtitle, description, keywords, screenshots, privacy policy URL
4. **Version Info**: Set version number (matches `package.json`) and build number
5. **Review**: Submit for Apple review (typically 24-48 hours)

### Android (Google Play Console)

1. **Create App**: In Google Play Console, create a new app with your package name
2. **Upload Bundle**: Use `eas submit --platform android` or upload the `.aab` manually
3. **Fill Store Listing**: App title, short description, full description, graphics, etc.
4. **Content Rating**: Complete the content rating questionnaire
5. **Pricing**: Set as free or paid, configure in-app products (RevenueCat handles this)
6. **Release**: Submit for review (typically 1-3 days for new apps, faster for updates)

---

## CI/CD (Optional)

You can automate the deployment pipeline with GitHub Actions:

```yaml
# .github/workflows/build-and-deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - run: npx eas-cli build --platform ios --profile production --non-interactive
        env:
          EXPO_CLI_PASSWORD: ${{ secrets.EXPO_CLI_PASSWORD }}

  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - run: npx eas-cli build --platform android --profile production --non-interactive
        env:
          EXPO_CLI_PASSWORD: ${{ secrets.EXPO_CLI_PASSWORD }}
```

> **Note**: This is a simplified example. A full CI/CD pipeline would include testing, linting, and store submission steps.

---

## Rollback Plan

### App Rollback

Expo builds are immutable — you can't "rollback" a submitted build. Instead:

1. **Rapid hotfix**: Fix the bug, bump the build number, rebuild, and resubmit
2. **Disable problematic feature**: If the bug is in a specific feature, add a remote flag (via Supabase or Clerk) to disable it until the fix ships
3. **Emergency release**: Use `expo-updates` to push a small JS-only patch if the issue is in JavaScript code (not native)

### Backend Rollback

For Supabase:

1. **Database**: Restore from a backup point (Supabase offers point-in-time recovery on Pro plans)
2. **Edge Functions**: Redeploy the previous version from Git history
3. **Storage**: No rollback needed (objects are immutable)

---

## Post-Deployment Checklist

- [ ] **Smoke test on real devices**: iOS + Android, both new installs and updates
- [ ] **Auth flow**: Sign up / sign in via Google + email OTP works
- [ ] **Core features**: Wardrobe add, outfit generation, streaks, planner chat
- [ ] **Edge functions**: Test each function manually (upload an item, run a scan, try VTO)
- [ ] **Push notifications**: Verify FCM token is registered and notifications are received
- [ ] **RevenueCat**: Verify subscription purchase flow and entitlement check
- [ ] **Realtime**: Verify notifications and wardrobe sync work across devices
- [ ] **Rate limits**: Confirm edge functions are rate-limited (try rapid-fire calls)
- [ ] **Error monitoring**: Check Sentry for any immediate errors
- [ ] **Analytics**: Verify analytics_logs are being written (if enabled)
- [ ] **Community feed**: Verify posts are visible and interactions work
- [ ] **Load test results reviewed**: If a load test was run, ensure no regressions

---

## Monitoring

### Sentry

Look AI uses Sentry for error tracking. After deployment:

1. Check the Sentry dashboard for new errors
2. Look for spikes in error rate compared to the previous release
3. Set up alerts for critical error thresholds

### Supabase Logs

- **API Logs**: Check Supabase dashboard → API → Logs for PostgREST errors
- **Edge Function Logs**: Check Functions → Logs for function execution errors
- **Database Logs**: Check Database → Logs for slow queries or connection issues

### RevenueCat Dashboard

- Monitor subscription metrics, churn, and revenue
- Verify entitlement delivery is working

---

## Troubleshooting Common Issues

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed troubleshooting guides.

Common deployment issues:

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Build fails with "missing credentials" | EAS not configured with app store credentials | Run `eas credentials` to set up |
| Edge function returns 401 | JWT not being passed or verify_jwt mismatch | Check `config.toml` and JWT template in Clerk |
| Rate limit errors in production | Upstash Redis not configured or unreachable | Set UPSTASH secrets on Supabase project |
| Images not loading | Cloudinary URL mismatch or bucket policy issue | Check Cloudinary settings and Supabase storage policies |
| Push notifications not received | FCM not configured or token not registered | Check `google-services.json` / `GoogleService-Info.plist` and Firebase console |
| Streaks not syncing | `user_gamification` row missing or RLS issue | Check RLS policies and run streak sync manually |
